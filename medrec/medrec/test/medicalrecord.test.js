const MedicalRecord = artifacts.require("MedicalRecord");

// Small helper: expect a transaction to revert.
// If expectedMessage is given, also check the revert reason text.
async function expectRevert(promise, expectedMessage) {
  try {
    await promise;
  } catch (error) {
    if (expectedMessage) {
      assert(
        error.message.includes(expectedMessage),
        `Expected revert reason "${expectedMessage}" but got: ${error.message}`
      );
    }
    return; // reverted as expected
  }
  assert.fail("Expected the transaction to revert, but it did not");
}

contract("MedicalRecord", (accounts) => {
  const owner = accounts[0];   // deployer = admin
  const patient = accounts[1];
  const doctor = accounts[2];
  const other = accounts[3];   // unregistered random account
  const doctor2 = accounts[4];

  let instance;

  // Fresh contract before each test so tests stay independent.
  beforeEach(async () => {
    instance = await MedicalRecord.new({ from: owner });
  });

  // -------------------------------------------------
  // DEPLOYMENT
  // -------------------------------------------------
  describe("Deployment", () => {
    it("sets the deployer as the owner", async () => {
      assert.equal(await instance.owner(), owner);
    });

    it("starts with recordCounter at 0", async () => {
      assert.equal((await instance.recordCounter()).toString(), "0");
    });
  });

  // -------------------------------------------------
  // REGISTER PATIENT
  // -------------------------------------------------
  describe("registerPatient", () => {
    it("lets the owner register a patient and emits PatientRegistered", async () => {
      const tx = await instance.registerPatient(patient, { from: owner });
      assert.equal(await instance.patients(patient), true);
      assert.equal(tx.logs[0].event, "PatientRegistered");
      assert.equal(tx.logs[0].args.patient, patient);
    });

    it("reverts if a non-owner tries to register a patient", async () => {
      await expectRevert(
        instance.registerPatient(patient, { from: other }),
        "Only owner can perform this action"
      );
    });

    it("reverts when registering the zero address", async () => {
      await expectRevert(
        instance.registerPatient(
          "0x0000000000000000000000000000000000000000",
          { from: owner }
        ),
        "Invalid address"
      );
    });

    it("reverts when registering the same patient twice", async () => {
      await instance.registerPatient(patient, { from: owner });
      await expectRevert(
        instance.registerPatient(patient, { from: owner }),
        "Patient already registered"
      );
    });
  });

  // -------------------------------------------------
  // REGISTER DOCTOR
  // -------------------------------------------------
  describe("registerDoctor", () => {
    it("lets the owner register a doctor and emits DoctorRegistered", async () => {
      const tx = await instance.registerDoctor(doctor, { from: owner });
      assert.equal(await instance.doctors(doctor), true);
      assert.equal(tx.logs[0].event, "DoctorRegistered");
      assert.equal(tx.logs[0].args.doctor, doctor);
    });

    it("reverts if a non-owner tries to register a doctor", async () => {
      await expectRevert(
        instance.registerDoctor(doctor, { from: other }),
        "Only owner can perform this action"
      );
    });

    it("reverts when registering the zero address", async () => {
      await expectRevert(
        instance.registerDoctor(
          "0x0000000000000000000000000000000000000000",
          { from: owner }
        ),
        "Invalid address"
      );
    });

    it("reverts when registering the same doctor twice", async () => {
      await instance.registerDoctor(doctor, { from: owner });
      await expectRevert(
        instance.registerDoctor(doctor, { from: owner }),
        "Doctor already registered"
      );
    });
  });

  // -------------------------------------------------
  // ADD RECORD
  // -------------------------------------------------
  describe("addRecord", () => {
    beforeEach(async () => {
      await instance.registerPatient(patient, { from: owner });
    });

    it("lets a registered patient add a record and emits RecordAdded", async () => {
      const tx = await instance.addRecord("Flu", "Paracetamol", { from: patient });
      assert.equal((await instance.recordCounter()).toString(), "1");

      const rec = await instance.records(1);
      assert.equal(rec.diagnosis, "Flu");
      assert.equal(rec.treatment, "Paracetamol");
      assert.equal(rec.patient, patient);

      assert.equal(tx.logs[0].event, "RecordAdded");
      assert.equal(tx.logs[0].args.recordId.toString(), "1");
      assert.equal(tx.logs[0].args.patient, patient);
    });

    it("reverts if a non-patient (unregistered) tries to add a record", async () => {
      await expectRevert(
        instance.addRecord("Flu", "Paracetamol", { from: other }),
        "Only registered patients allowed"
      );
    });

    it("reverts when diagnosis is empty", async () => {
      await expectRevert(
        instance.addRecord("", "Paracetamol", { from: patient }),
        "Diagnosis cannot be empty"
      );
    });

    it("reverts when treatment is empty", async () => {
      await expectRevert(
        instance.addRecord("Flu", "", { from: patient }),
        "Treatment cannot be empty"
      );
    });
  });

  // -------------------------------------------------
  // GRANT / REVOKE ACCESS
  // -------------------------------------------------
  describe("grantAccess and revokeAccess", () => {
    beforeEach(async () => {
      await instance.registerPatient(patient, { from: owner });
      await instance.registerDoctor(doctor, { from: owner });
    });

    it("lets a patient grant access to a registered doctor and emits AccessGranted", async () => {
      const tx = await instance.grantAccess(doctor, { from: patient });
      assert.equal(await instance.checkAccess(patient, doctor), true);
      assert.equal(tx.logs[0].event, "AccessGranted");
      assert.equal(tx.logs[0].args.patient, patient);
      assert.equal(tx.logs[0].args.doctor, doctor);
    });

    it("reverts grantAccess if the doctor is not registered", async () => {
      await expectRevert(
        instance.grantAccess(doctor2, { from: patient }),
        "Doctor not registered"
      );
    });

    it("reverts grantAccess if caller is not a registered patient", async () => {
      await expectRevert(
        instance.grantAccess(doctor, { from: other }),
        "Only registered patients allowed"
      );
    });

    it("lets a patient revoke access and emits AccessRevoked", async () => {
      await instance.grantAccess(doctor, { from: patient });
      const tx = await instance.revokeAccess(doctor, { from: patient });
      assert.equal(await instance.checkAccess(patient, doctor), false);
      assert.equal(tx.logs[0].event, "AccessRevoked");
    });

    it("reverts revokeAccess if the doctor is not registered", async () => {
      await expectRevert(
        instance.revokeAccess(doctor2, { from: patient }),
        "Doctor not registered"
      );
    });
  });

  // -------------------------------------------------
  // REQUEST ACCESS
  // -------------------------------------------------
  describe("requestAccess", () => {
    beforeEach(async () => {
      await instance.registerPatient(patient, { from: owner });
      await instance.registerDoctor(doctor, { from: owner });
    });

    it("lets a registered doctor request access and emits AccessRequested", async () => {
      const tx = await instance.requestAccess(patient, { from: doctor });
      assert.equal(tx.logs[0].event, "AccessRequested");
      assert.equal(tx.logs[0].args.doctor, doctor);
      assert.equal(tx.logs[0].args.patient, patient);
    });

    it("reverts if a non-doctor tries to request access", async () => {
      await expectRevert(
        instance.requestAccess(patient, { from: other }),
        "Only registered doctors allowed"
      );
    });

    it("reverts if the patient is not registered", async () => {
      await expectRevert(
        instance.requestAccess(other, { from: doctor }),
        "Patient not registered"
      );
    });
  });

  // -------------------------------------------------
  // VIEW RECORD (access control)
  // -------------------------------------------------
  describe("viewRecord", () => {
    beforeEach(async () => {
      await instance.registerPatient(patient, { from: owner });
      await instance.registerDoctor(doctor, { from: owner });
      await instance.addRecord("Flu", "Paracetamol", { from: patient });
    });

    it("lets the patient view their own record", async () => {
      const r = await instance.viewRecord(1, { from: patient });
      assert.equal(r[0].toString(), "1");
      assert.equal(r[1], "Flu");
      assert.equal(r[2], "Paracetamol");
      assert.equal(r[3], patient);
    });

    it("lets an authorized doctor view the record after access is granted", async () => {
      await instance.grantAccess(doctor, { from: patient });
      const r = await instance.viewRecord(1, { from: doctor });
      assert.equal(r[1], "Flu");
      assert.equal(r[2], "Paracetamol");
    });

    it("reverts when a doctor without permission tries to view", async () => {
      await expectRevert(
        instance.viewRecord(1, { from: doctor }),
        "Access denied"
      );
    });

    it("reverts when the record does not exist", async () => {
      await expectRevert(
        instance.viewRecord(999, { from: patient }),
        "Record does not exist"
      );
    });

    it("blocks a doctor from viewing after access is revoked", async () => {
      await instance.grantAccess(doctor, { from: patient });
      await instance.revokeAccess(doctor, { from: patient });
      await expectRevert(
        instance.viewRecord(1, { from: doctor }),
        "Access denied"
      );
    });
  });

  // -------------------------------------------------
  // CHECK ACCESS
  // -------------------------------------------------
  describe("checkAccess", () => {
    beforeEach(async () => {
      await instance.registerPatient(patient, { from: owner });
      await instance.registerDoctor(doctor, { from: owner });
    });

    it("returns false when no permission has been granted", async () => {
      assert.equal(await instance.checkAccess(patient, doctor), false);
    });

    it("returns true after permission is granted", async () => {
      await instance.grantAccess(doctor, { from: patient });
      assert.equal(await instance.checkAccess(patient, doctor), true);
    });
  });
});
