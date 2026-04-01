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

## 9. Security Awareness and Procedures

- Personnel with system access must review this policy and acknowledge it.
- Security expectations should be reinforced during onboarding and periodically thereafter.
- Team members must know how to report suspicious activity, credential exposure, phishing attempts, or signs of provider compromise.
- Changes to billing or payment architecture must be reviewed for security impact before launch.

## 10. Payment and PCI Controls

Nightlife Flyers uses an outsourced ecommerce payment model.

- Card payments must be accepted through an approved payment provider such as PowerTranz using a hosted or outsourced payment page where possible.
- Nightlife Flyers systems must not directly capture, process, transmit, or store raw payment card data unless a separate approved architecture and compliance review is completed.
- Integration changes that affect the payment flow must be documented and reviewed before release.
- Only the minimum billing metadata required for entitlements, subscriptions, support, or reconciliation may be stored by Nightlife Flyers.

## 11. Security Incident Response

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

## 12. Third-Party Service Providers

Nightlife Flyers relies on third-party providers for core operations. Providers should be selected and maintained with reasonable due diligence, especially where they affect:

- hosting and deployment
- authentication
- billing and payment processing
- database and storage
- AI generation services
- email and communications

Where a provider handles billing or customer-related data, Nightlife Flyers should maintain clear documentation of what that provider is responsible for and what Nightlife Flyers retains internally.

## 13. User Access Management

- Access must be granted according to least privilege.
- MFA should be enabled for high-risk systems whenever available.
- Access reviews should be performed periodically for production, billing, and administrative platforms.
- Departed users and expired contractors must be removed from production and vendor systems promptly.

## 14. Access Control Policy

- Development, production, and billing access should be separated as much as practical.
- Client-side code must never contain private keys or secrets intended only for server-side use.
- Environment variables and secret values must be managed through approved deployment and hosting controls.
- Admin-only capabilities should not be exposed to standard customer sessions.

## 15. Payment Architecture Statement

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

