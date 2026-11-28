---
layout: page
title: "Cracking Protected Files"
subtitle: "Recovering passwords for archives, documents, SSH keys, OpenSSL and BitLocker volumes"
permalink: /methodology/passwords/cracking-protected-files/
---

Encrypted files are a frequent source of credentials and sensitive data on user systems and file shares. Protected documents, archives, private keys and encrypted disks all depend on a password that can often be recovered offline. The workflow is the same for each: locate the protected files, identify the format, extract a crackable hash with the matching helper, crack it and use the recovered password to open the file.

## Workflow

1. Locate candidate encrypted files by extension and location.
2. Identify the exact format with the `file` command or by inspecting the header.
3. Extract a hash with the matching helper, or confirm that the file uses a password the tool can test.
4. Crack the hash with John or Hashcat, using wordlists and targeted rules.
5. Open the file with the recovered password and record the result.

## Locating protected files

```bash
for ext in $(echo ".xls .xls* .xltx .od* .doc .doc* .pdf .pot .pot* .pp*"); do echo -e "\nFile extension: $ext"; find / -name "*$ext" 2>/dev/null | grep -v "lib\|fonts\|share\|core"; done
```

Adjust the extension list to the target. Archive formats and key files can be searched in the same way, and the compressed-extension list for a given site can be pulled with `curl` and `html2text`.

## Documents and archives

```bash
office2john.py PROTECTED.docx > docx.hash
pdf2john.py DOCUMENT.pdf > pdf.hash
zip2john ARCHIVE.zip > zip.hash
john --wordlist=WORDLIST docx.hash
john docx.hash --show
```

Replace the file name and extension for each format. The same pattern applies to RAR archives with `rar2john`.

## SSH private keys

Confirm whether a key is protected before cracking it. A key that asks for a passphrase when its public component is derived is encrypted:

```bash
ssh-keygen -yf ~/.ssh/KEY_FILE
```

Find keys by their header, which begins with `-----BEGIN ... PRIVATE KEY-----`:

```bash
grep -rnE '^\-{5}BEGIN [A-Z0-9]+ PRIVATE KEY\-{5}$' /* 2>/dev/null
```

Extract and crack the passphrase:

```bash
ssh2john.py SSH.private > ssh.hash
john --wordlist=WORDLIST ssh.hash
```

## OpenSSL-encrypted files

The `file` command reports the encryption type. A file reported as "openssl enc'd data with salted password" can be tested against a wordlist, with each candidate passed to `openssl enc` and the result piped to a tar extractor:

```bash
file ARCHIVE.gzip
for i in $(cat WORDLIST); do openssl enc -aes-256-cbc -d -in ARCHIVE.gzip -k "$i" 2>/dev/null | tar xz; done
```

> Run the loop in an empty directory. Each successful candidate extracts files, so an incorrect candidate may leave partial output behind.
{: .warning }

## BitLocker volumes

`bitlocker2john` produces several hashes. The first two are for the user password and the other two are for the 48-digit recovery key, which is too long to crack in practice. Extract only the `$bitlocker$0$` entry and crack it with Hashcat mode 22100:

```bash
bitlocker2john -i BACKUP.vhd > backup.hashes
grep "bitlocker\$0" backup.hashes > backup.hash
hashcat -m 22100 backup.hash WORDLIST
```

Once the password is known, mount the volume on Linux with `losetup` and `dislocker`:

```bash
sudo losetup -f -P BACKUP.vhd
sudo dislocker /dev/loop0p2 -u'PASSWORD' -- /media/bitlocker
sudo mount -o loop /media/bitlocker/dislocker-file /media/bitlockermount
```

Unmount in reverse order when finished.

## What to look for

- Office, PDF, archive or key files on shares and user profiles, especially with names that suggest passwords or backups.
- File headers that indicate encryption with a known format.
- A recovered password reused for other accounts or services.

## Pitfalls

- Hash extraction for a container may succeed while the password is strong. Estimate the time before running a large wordlist.
- Tar files are often encrypted with OpenSSL or GPG, so check the header before assuming a tar format.
- Mounting an encrypted disk changes the state of the host. Record each mount and unmount.

## Defense and prevention

Use strong, unique passwords for encrypted containers, protect private keys with passphrases, store recovery keys in a managed vault, and avoid storing backup volumes on shares that are broadly readable. See the [password prevention](/methodology/passwords/prevention/) page.
