---
layout: page
title: "Application Hardening"
subtitle: "General and application-specific defenses for the web applications covered in this section"
permalink: /methodology/common-apps/prevention/
---

Most attacks in this section succeed for the same reasons: an application nobody inventoried, a default or weak credential, an admin interface reachable from the internet, an out-of-date release or an untested backup. This page turns those lessons into controls for WordPress, Drupal, Joomla, Tomcat, Jenkins, osTicket, GitLab, PRTG, Splunk and the other products covered. Start with the inventory, apply the general controls everywhere, then work through the product-specific table.

## Start with an inventory

You cannot protect an application you do not know about. Build an inventory of internal and external applications from regular port scans and screenshots. Tools such as Nmap and EyeWitness are enough for a small team. The exercise often exposes shadow IT, retired applications that are still running, and trial products that have quietly become free versions without authentication. Splunk is the example the notes give of that last case.

## General controls

- **Strong authentication.** Enforce strong passwords at setup and registration, and change every default administrator password. Where possible, disable the default administrator account and create named administrators. Make two-factor authentication mandatory for administrator-level users wherever the product supports it.
- **Access control.** Keep login and administrative pages off the external network unless there is a documented business need. Limit file and folder permissions so that the web user cannot upload or deploy content it should not.
- **Remove unsafe features.** Disable features that let administrators edit code through the browser, such as PHP editing in WordPress. This limits what an attacker gains from a compromised administrator session.
- **Least privilege.** Limit the number of administrators, and give each account only the roles its job needs. Review them regularly.
- **Timely updates.** Apply vendor security patches as soon as they are available. Check the version of each application against known issues in the inventory.
- **Backups.** Back up both the site files and the database to a secondary location, and test restoring them. A tested backup is what makes recovery from a web compromise quick.
- **Monitoring.** Use security monitoring for the application, including detection of brute-force attempts. A web application firewall adds a layer of protection, but it complements the controls above and does not replace them.
- **Central identity.** Integrating an application with Active Directory single sign-on reduces the number of separate passwords, gives better auditing and makes the password policy apply everywhere.
- **Limit exposure.** Ask whether each public repository, ticketing system or admin console needs to be reachable from outside. Most do not.

> Changing a default administrator name or password is a small step that removes a common foothold. Confirm that scripts and integrations still work after the change, and record the new account names in the inventory.
{: .tip }

## Application-specific controls

| Application | Control area | Measure |
|---|---|---|
| WordPress | Security monitoring | Use a security plugin with monitoring, blocking of suspicious activity, country blocking and two-factor authentication |
| Joomla | Access control | Require a secret path to reach the administrator login, for example with the AdminExile extension |
| Drupal | Access control | Disable, hide or move the admin login page |
| Tomcat | Access control | Limit the Manager and Host-Manager applications to localhost. If they must be reachable, add IP allow-listing, a very strong password and a non-standard username |
| Jenkins | Access control | Configure permissions with the Matrix Authorization Strategy plugin |
| Splunk | Updates and licensing | Change the default password and make sure the instance is licensed so that authentication is enforced |
| PRTG Network Monitor | Authentication | Keep the product up to date and change the default password |
| osTicket | Access control | Limit access from the internet wherever possible |
| GitLab | Authentication | Restrict sign-up, for example by requiring administrator approval and allow-listing or deny-listing email domains |

Use each vendor's hardening guide for the exact version you run.

## Development-level controls

Some of the risks in this section come from the code, not the configuration. The notes highlight these measures for custom and third-party applications:

- **Validate input and parameterise queries.** Validate and sanitise input before it reaches an LDAP or SQL query, remove special characters where the protocol uses them, and keep user input as data rather than query syntax.
- **Restrict mass assignment.** Declare the attributes a user may set, using the framework's allow-list features, such as strong parameters in Rails.
- **Use three-tier architecture for thick clients.** A client that talks to an application server, rather than directly to the database, keeps users away from the database and reduces the attack surface.
- **Sign code and restrict what it can do.** Code signing and the platform's permission model limit what untrusted code can access.

## Ongoing review

Hardening decays unless it is repeated. Schedule these checks:

- Review the application inventory and remove anything no longer needed.
- Re-check the versions in use against the vendor's latest release and known issues.
- Confirm that administrator lists, MFA settings and exposed paths have not changed.
- Test a backup restore on a fixed schedule.
- Track findings from penetration tests to closure, and check periodically for the same classes of flaw.

For the individual attacks these controls prevent, see the pages in this section, for example [Tomcat](/methodology/common-apps/tomcat/), [Jenkins](/methodology/common-apps/jenkins/) and [Mass Assignment](/methodology/common-apps/mass-assignment/).
