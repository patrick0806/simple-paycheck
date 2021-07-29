#Configuração do Droplet

Este droplet foi criado com base em dois artigos da DigitalOcean

#### 1 [How To Install Nginx on Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04)

#### 2 [How To Set Up a Node.js Application for Production on Ubuntu 20.04](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04)

Após seguir esses artigos e já ter instalado o e configurado  ningx e o pm2

#### 3 - Instalar o imageMagick e configura-lo
rode os seguintes comandos

```bash
sudo apt-get install imagemagick
```

agora vamos habilitar a leitura e escrita de pdf's e que o imageMagick rode por mais tempo por conta da qualidade das imagens

```bash
sudo nano /etc/ImageMagick-6/policy.xml
```

```bash
change this
<policy domain="resource" name="disk" value="1GiB"/>

for this 
<policy domain="resource" name="disk" value="8GiB"/>

<!-- disable ghostscript format types --> 
<policy domain="coder" rights="none" pattern="PS"/>
<policy domain="coder" rights="none" pattern="EPS"/>
<policy domain="coder" rights="none" pattern="PDF" /> <------- Edite esse linha!! 
<policy domain="coder" rights="none" pattern="XPS" />


<policy domain="coder" rights="read | write" pattern="PDF" /> <------ com esse código
```



ip do droplet http://147.182.224.46/