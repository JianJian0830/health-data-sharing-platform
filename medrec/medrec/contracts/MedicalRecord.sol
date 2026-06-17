// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicalRecord
 * @notice A patient-controlled platform for sharing medical records on Ethereum.
 * @dev An administrator (the contract owner) registers patients and doctors.
 *      Each patient owns their records and decides which registered doctors
 *      are allowed to read them. Doctors can only view a record after the
 *      patient has explicitly granted access.
 *
 * SECURITY: Integer overflow / underflow protection is built in.
 *           This contract targets Solidity ^0.8.x, where all arithmetic
 *           (e.g. recordCounter++) reverts automatically on overflow,
 *           so no SafeMath library is required.
 */
contract MedicalRecord {

    // =====================================================
    // STATE VARIABLES
    // =====================================================

    /// @notice The administrator who deployed the contract.
    address public owner;

    /// @notice Running total of records created; also used as the next record ID.
    uint256 public recordCounter;

    /// @notice Registered patient addresses.
    mapping(address => bool) public patients;

    /// @notice Registered doctor addresses.
    mapping(address => bool) public doctors;

    /// @notice Access permissions: patient => doctor => allowed?
    mapping(address => mapping(address => bool)) public accessPermissions;

    // =====================================================
    // STRUCTS
    // =====================================================

    /// @notice A single medical record owned by one patient.
    struct Record {
        uint256 recordId;
        string diagnosis;
        string treatment;
        address patient;
        uint256 timestamp;
    }

    /// @notice Stored records, keyed by record ID.
    mapping(uint256 => Record) public records;

    // =====================================================
    // EVENTS
    // =====================================================

    event PatientRegistered(address indexed patient);
    event DoctorRegistered(address indexed doctor);
    event RecordAdded(uint256 indexed recordId, address indexed patient);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);
    event AccessRequested(address indexed doctor, address indexed patient);

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    /// @notice Sets the deploying account as the owner/administrator.
    constructor() {
        owner = msg.sender;
    }

    // =====================================================
    // MODIFIERS
    // =====================================================

    // SECURITY: Role-based access control (RBAC).
    //           Restricts administrative actions to the contract owner only.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    // SECURITY: Role-based access control (RBAC).
    //           Only addresses registered as patients may manage their own data.
    modifier onlyPatient() {
        require(patients[msg.sender], "Only registered patients allowed");
        _;
    }

    // SECURITY: Role-based access control (RBAC).
    //           Only addresses registered as doctors may request access.
    modifier onlyDoctor() {
        require(doctors[msg.sender], "Only registered doctors allowed");
        _;
    }

    // =====================================================
    // ADMIN FUNCTIONS
    // =====================================================

    /**
     * @notice Register a new patient. Owner only.
     * @dev Reverts on the zero address or an already-registered patient.
     *      SECURITY: input validation via require() with descriptive messages.
     * @param patientAddress The wallet address to register as a patient.
     */
    function registerPatient(address patientAddress) public onlyOwner {
        require(patientAddress != address(0), "Invalid address");
        require(!patients[patientAddress], "Patient already registered");
        patients[patientAddress] = true;
        emit PatientRegistered(patientAddress);
    }

    /**
     * @notice Register a new doctor. Owner only.
     * @dev Reverts on the zero address or an already-registered doctor.
     * @param doctorAddress The wallet address to register as a doctor.
     */
    function registerDoctor(address doctorAddress) public onlyOwner {
        require(doctorAddress != address(0), "Invalid address");
        require(!doctors[doctorAddress], "Doctor already registered");
        doctors[doctorAddress] = true;
        emit DoctorRegistered(doctorAddress);
    }

    // =====================================================
    // PATIENT FUNCTIONS
    // =====================================================

    /**
     * @notice Add a medical record for the calling patient.
     * @dev Only callable by a registered patient. Diagnosis and treatment
     *      must be non-empty. recordCounter increments first, then the record
     *      is stored (state change) and an event is emitted.
     * @param diagnosis The diagnosis text.
     * @param treatment The treatment text.
     */
    function addRecord(string calldata diagnosis, string calldata treatment)
        external
        onlyPatient
    {
        require(bytes(diagnosis).length > 0, "Diagnosis cannot be empty");
        require(bytes(treatment).length > 0, "Treatment cannot be empty");

        recordCounter++;

        records[recordCounter] = Record({
            recordId: recordCounter,
            diagnosis: diagnosis,
            treatment: treatment,
            patient: msg.sender,
            timestamp: block.timestamp
        });

        emit RecordAdded(recordCounter, msg.sender);
    }

    /**
     * @notice Grant a registered doctor permission to view the caller's records.
     * @dev Only callable by a registered patient; the doctor must be registered.
     * @param doctor The doctor address to grant access to.
     */
    function grantAccess(address doctor) external onlyPatient {
        require(doctors[doctor], "Doctor not registered");
        accessPermissions[msg.sender][doctor] = true;
        emit AccessGranted(msg.sender, doctor);
    }

    /**
     * @notice Revoke a doctor's permission to view the caller's records.
     * @dev Only callable by a registered patient; the doctor must be registered.
     * @param doctor The doctor address to revoke access from.
     */
    function revokeAccess(address doctor) external onlyPatient {
        require(doctors[doctor], "Doctor not registered");
        accessPermissions[msg.sender][doctor] = false;
        emit AccessRevoked(msg.sender, doctor);
    }

    // =====================================================
    // DOCTOR FUNCTIONS
    // =====================================================

    /**
     * @notice A registered doctor requests access to a patient's records.
     * @dev Emits an event so the patient can later grant access. Does not
     *      change permissions by itself.
     * @param patient The patient the doctor is requesting access from.
     */
    function requestAccess(address patient) external onlyDoctor {
        require(patients[patient], "Patient not registered");
        emit AccessRequested(msg.sender, patient);
    }

    // =====================================================
    // VIEW FUNCTIONS
    // =====================================================

    /**
     * @notice View a medical record by ID.
     * @dev SECURITY: access control on read — the caller must be either the
     *      patient who owns the record or a doctor the patient has authorised.
     *      Reverts if the record does not exist.
     * @param recordId The ID of the record to view.
     * @return The record ID, diagnosis, treatment, patient address, and timestamp.
     */
    function viewRecord(uint256 recordId)
        external
        view
        returns (uint256, string memory, string memory, address, uint256)
    {
        Record memory record = records[recordId];
        require(record.recordId != 0, "Record does not exist");

        bool isOwner = msg.sender == record.patient;
        bool isAuthorizedDoctor = accessPermissions[record.patient][msg.sender];
        require(isOwner || isAuthorizedDoctor, "Access denied");

        return (
            record.recordId,
            record.diagnosis,
            record.treatment,
            record.patient,
            record.timestamp
        );
    }

    /**
     * @notice Check whether a doctor currently has access to a patient's records.
     * @param patient The patient address.
     * @param doctor The doctor address.
     * @return True if the doctor is permitted, false otherwise.
     */
    function checkAccess(address patient, address doctor)
        external
        view
        returns (bool)
    {
        return accessPermissions[patient][doctor];
    }
}
