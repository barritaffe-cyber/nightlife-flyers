# Information Security Policy

Company: Nightlife Flyers

Effective date: April 1, 2026

Review cycle: Annual, and whenever payment architecture, vendors, or security controls materially change.

## Introduction

This policy defines the baseline information security requirements for Nightlife Flyers. It applies to employees, contractors, founders, and service providers with access to company systems, customer information, billing metadata, design assets, or administrative tools.

Nightlife Flyers operates a web-based design platform and uses third-party payment infrastructure for card acceptance. The company does not intentionally store raw cardholder data in its own application databases or source code. Payment processing is handled through a hosted or outsourced payment flow provided by an approved payment service provider.

## Policy Statement

Nightlife Flyers will:

- protect customer, employee, and company information from unauthorized access, alteration, disclosure, or destruction
- minimize the collection and storage of sensitive payment data
- use third-party providers for payment acceptance where possible so card data is not handled directly by the application
- restrict access to production systems and customer data to authorized personnel with a legitimate business need
- review security controls and third-party vendors on a regular basis
- maintain incident response procedures for security and payment-related events

## Scope

This policy applies to:

- the Nightlife Flyers application and supporting infrastructure
- admin tools, deployment workflows, source repositories, and cloud environments
- company-issued and approved personal devices used for company work
- third-party platforms used for hosting, billing, authentication, storage, analytics, and communications

## 1. Network Security

- Production services must be hosted with reputable cloud providers and protected by vendor-managed network controls, TLS, and access restrictions.
- Administrative access to hosting, database, domain, and billing platforms must require strong authentication and should use MFA wherever supported.
- Network and service architecture should be documented at a high level and updated when payment or production infrastructure changes.
- Public endpoints that support customer access or payment workflows should be reviewed for exposure and unnecessary services should remain disabled.

## 2. Acceptable Use

- Company systems may only be used for authorized business purposes.
- Users may not install unapproved software, connect unapproved integrations, or share credentials.
- Sensitive business data may not be copied into unmanaged personal tools, public repositories, or unsecured messaging channels.
- Users must lock devices when unattended and keep systems updated with current OS and browser security patches.

## 3. Protect Stored Data

- Nightlife Flyers must not store full card numbers, CVV/CVC values, track data, PIN data, or equivalent sensitive authentication data in application databases, logs, support tickets, or source code.
- If billing-related records are stored, they must be limited to non-sensitive metadata such as customer IDs, subscription IDs, plan status, and billing period dates.
- Stored account-data controls apply to all locations where billing-related information may exist, including production databases, application logs, support systems, secure exports, approved cloud storage, backup locations, administrator local files, and any third-party operational platforms used by Nightlife Flyers.
- Sensitive authentication data must not be stored after authorization. Nightlife Flyers does not intentionally store sensitive authentication data prior to authorization in its own systems. If such data is ever unexpectedly received, it must be treated as a security incident, deleted immediately where feasible, and escalated according to the incident response process.
- Secrets including API keys, webhook secrets, database credentials, and service tokens must be stored in approved secret or environment-variable systems, never hard-coded into client code.
- Access to production data stores must be limited to personnel with a documented operational need.

## 4. Information Classification

Nightlife Flyers classifies information as:

- Confidential: customer account data, internal credentials, security artifacts, production logs with user context, billing identifiers, incident records
- Internal: operating procedures, product plans, non-public analytics, internal documentation
- Public: published website content, marketing materials, public pricing content, public policies

Confidential information requires the highest level of access control and must not be shared externally without authorization.

## 5. Access to Sensitive Information

- Access to production systems, Supabase, hosting platforms, code repositories, billing dashboards, and provider consoles must be role-based and limited to authorized personnel.
- Shared accounts are prohibited unless technically unavoidable and explicitly approved; named user accounts are preferred.
- Access should be removed promptly when no longer required, including contractor offboarding.
- Administrative actions related to billing, exports, subscriptions, and security settings should be limited to a small set of trusted operators.

## 6. Physical Security

- Company laptops, phones, and other devices used for business must be protected by device passcodes, screen lock, and disk encryption where supported.
- Printed materials containing confidential information should be avoided. If printed, they must be secured and destroyed when no longer needed.
- Office or remote work environments must take reasonable steps to prevent unauthorized viewing of confidential data.

## 7. Protect Data in Transit

- Sensitive data must be transmitted over encrypted channels such as HTTPS/TLS.
- Raw cardholder data must not be sent through email, chat, ticketing systems, spreadsheets, or support conversations.
- Customer-facing payment flows should use an outsourced or hosted payment page from the approved payment provider.
- Internal operational transfers of confidential data should use approved secure platforms only.

## 8. Disposal of Data

- Data that is no longer needed must be deleted in accordance with business, legal, and operational requirements.
- Secrets must be revoked and replaced when exposure is suspected.
- Local files containing confidential data should be deleted when no longer required.
- Any printed confidential materials must be shredded or otherwise destroyed so they cannot be reconstructed.

## 9. Data Retention and Secure Disposal

Nightlife Flyers retains the minimum billing-related account data necessary for business operations, entitlement management, customer support, reconciliation, fraud review, legal obligations, and audit support.

- Raw cardholder data and sensitive authentication data must not be retained in Nightlife Flyers systems.
- The only billing-related account data approved for internal retention is limited metadata such as customer identifiers, provider subscription or transaction identifiers, plan status, access entitlements, billing period dates, and support records required to service the account.
- Retention requirements apply across all storage locations, including production databases, logs, secure exports, approved cloud storage, backups, administrator local files, and third-party operational tools used by Nightlife Flyers.
- Billing metadata must be retained only for as long as required for legal, regulatory, tax, dispute-handling, accounting, support, or documented business needs.
- Unless a longer period is required by law or an open business issue exists, billing-related account metadata should be reviewed for deletion when it is older than 24 months after the associated subscription, transaction, or support matter is no longer active.
- The business justification for retaining limited billing metadata is to support subscription enforcement, customer account recovery, support history, financial reconciliation, chargeback or dispute response, fraud review, and legally required recordkeeping.
- When retained account data is no longer required, it must be securely deleted or rendered unrecoverable from the relevant system. Acceptable methods include deletion from active application records, deletion of local export files, removal from approved storage locations, and secure vendor-managed disposal mechanisms where the data resides with a provider.
- Any local administrative files containing billing metadata must be deleted when no longer needed and must not be copied into unmanaged or personal storage locations.
- A documented review of retained billing-related account data must occur at least once every three months to verify that data exceeding the approved retention period has been securely deleted or rendered unrecoverable where practical.
- The quarterly review must record the review date, reviewer, systems checked, data categories checked, findings, and any remediation actions.

## 10. Security Awareness and Procedures

- Personnel with system access must review this policy and acknowledge it.
- Security expectations should be reinforced during onboarding and periodically thereafter.
- Team members must know how to report suspicious activity, credential exposure, phishing attempts, or signs of provider compromise.
- Changes to billing or payment architecture must be reviewed for security impact before launch.

## 11. Payment and PCI Controls

Nightlife Flyers uses an outsourced ecommerce payment model.

- Card payments must be accepted through an approved payment provider such as PowerTranz using a hosted or outsourced payment page where possible.
- Nightlife Flyers systems must not directly capture, process, transmit, or store raw payment card data unless a separate approved architecture and compliance review is completed.
- Integration changes that affect the payment flow must be documented and reviewed before release.
- Only the minimum billing metadata required for entitlements, subscriptions, support, or reconciliation may be stored by Nightlife Flyers.
- Retention and disposal requirements for stored account data must follow Section 9 of this policy and be reviewed at least quarterly.

## 12. Security Incident Response

All suspected security incidents must be reported immediately to management or the designated incident owner.

Examples include:

- suspected unauthorized access to hosting, database, billing, or authentication systems
- exposure of API keys, webhook secrets, or admin credentials
- unexpected changes to billing or payment provider settings
- reports or evidence that card data was handled outside the approved outsourced flow
- suspicious exports, data access, or provider webhook behavior

Minimum response actions:

1. Contain the issue and limit further exposure.
2. Preserve logs, screenshots, request IDs, and relevant evidence.
3. Revoke or rotate affected secrets and credentials.
4. Assess customer, billing, and operational impact.
5. Notify required providers, partners, or affected parties where appropriate.
6. Document remediation and preventive actions.

## 13. Third-Party Service Providers

Nightlife Flyers relies on third-party providers for core operations. Providers should be selected and maintained with reasonable due diligence, especially where they affect:

- hosting and deployment
- authentication
- billing and payment processing
- database and storage
- AI generation services
- email and communications

Where a provider handles billing or customer-related data, Nightlife Flyers should maintain clear documentation of what that provider is responsible for and what Nightlife Flyers retains internally.

## 14. User Access Management

- Access must be granted according to least privilege.
- MFA should be enabled for high-risk systems whenever available.
- Access reviews should be performed periodically for production, billing, and administrative platforms.
- Departed users and expired contractors must be removed from production and vendor systems promptly.

## 15. Access Control Policy

- Development, production, and billing access should be separated as much as practical.
- Client-side code must never contain private keys or secrets intended only for server-side use.
- Environment variables and secret values must be managed through approved deployment and hosting controls.
- Admin-only capabilities should not be exposed to standard customer sessions.

## 16. Payment Architecture Statement

Current intended payment model:

- Ecommerce
- Payment page entirely outsourced or hosted by the payment provider, unless a later approved architecture is documented
- No intentional storage of cardholder data in Nightlife Flyers systems

If the payment architecture changes, this policy must be updated before the new flow goes live.

## Appendix A: Acknowledgement

All personnel with system access should acknowledge that they have read and understood this policy.

Suggested acknowledgement text:

> I acknowledge that I have read and understand the Nightlife Flyers Information Security Policy and agree to comply with it.

## Appendix B: System and Provider Inventory

Maintain a current list of:

- hosting and deployment platforms
- database and storage providers
- billing/payment providers
- authentication providers
- email and communications providers
- AI providers
- company-managed devices used for production access

## Appendix C: Payment and Compliance Notes

For the current architecture:

- payment provider: PowerTranz
- payment method: ecommerce
- expected shopping cart model: payment page entirely outsourced, unless implementation changes
- internal storage allowed: billing metadata only
- prohibited storage: full PAN, CVV/CVC, track data, PIN data
- sensitive authentication data: not intentionally stored before or after authorization
- retention review cadence: at least once every three months
