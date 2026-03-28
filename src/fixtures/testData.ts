import { faker } from "@faker-js/faker";

export function createTestPerson() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase()
  };
}

export function createMailinatorInbox() {
  return `wd_tester_${String(Date.now()).slice(-10)}`;
}

export function createTestCompany() {
  return {
    name: faker.company.name(),
    catchPhrase: faker.company.catchPhrase()
  };
}

export function createContractData() {
  const company = createTestCompany();
  const person = createTestPerson();
  return {
    partyNames: [company.name, person.fullName],
    effectiveDate: faker.date.past({ years: 1 }).toISOString().split("T")[0]!,
    riskFlags: faker.helpers.arrayElements(
      ["auto-renewal", "termination-penalty", "exclusive-dealing", "auto-renewal"],
      { min: 1, max: 3 }
    ),
    company,
    person
  };
}
