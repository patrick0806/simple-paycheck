const express = require("express");
const execa = require("execa");
const fs = require("fs-extra");
const multer = require("multer");
const readXlsxFile = require("read-excel-file/node");
const { format, sub } = require("date-fns");
const { ptBR } = require("date-fns/locale");
const SendinBlue = require("sib-api-v3-sdk");
const defaultClient = SendinBlue.ApiClient.instance;
const exec = require("child_process").exec;
require("dotenv").config();
const cors = require("cors");
const app = express();
const router = express.Router();

app.use(cors());
app.use(router);
app.set("view engine", "pug");
app.listen(3030, () => {
  console.log("Api Running in 3030 port");
});

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SEDINBLUE_APIKEY;

const apiInstance = new SendinBlue.TransactionalEmailsApi();

const upload = multer({ dest: "/tmp/" });

const files = upload.fields([
  { name: "pdf", maxCount: 1 },
  { name: "excel", maxCount: 1 },
]);

router.get('/',(req,resp)=>{
    return resp.render(`${__dirname}/views`,{title:'Creche Contra Cheque'});
})

async function cleanUpOldImages() {
  try {
    await execa("rm", [`/tmp/contra-cheque*.png`]);
  } catch (err) {}
}

router.post("/", files, async (req, res) => {
  try {
    const { pdf, excel } = req.files;

    console.log("recebi os arquivos");

    await cleanUpOldImages();

    child = exec(
      `convert -density 300 ${pdf[0].path} -quality 100 -background white -alpha remove -alpha off /tmp/contra-cheque.png`,
      async function (err, stdout, stderr) {
        if (err) {
          console.log(err);
          throw stderr;
        }
        console.log("passei do execa");
        const rows = await readXlsxFile(excel[0].path, { sheet: 3 }); // for dev tests comment {sheet:3}

        let lineNumber = 0;

        const mesPassado = sub(new Date(), { months: 1 });
        const nomeDoMes = format(mesPassado, "MMMM", { locale: ptBR });
        const ano = format(mesPassado, "yyyy");
        const dataLegivel = `${nomeDoMes} de ${ano}`;

        console.log(`iniciando o envio dos contracheques`);

        for (const row of rows) {
          lineNumber++;
          if (lineNumber === 1) {
            continue;
          }

          const nome = row[2];
          if (!nome || !nome.trim()) break;

          const email = row[3];
          if (!email) continue;

          const pagina = lineNumber - 2;

          const file = await fs.readFile(`/tmp/contra-cheque-${pagina}.png`);
          const attachment = file.toString("base64");
          const sendSmtpEmail = new SendinBlue.SendSmtpEmail();
          sendSmtpEmail.subject = `Contra-cheque ${dataLegivel}`;
          sendSmtpEmail.htmlContent = `<p>Olá, ${nome}</p><p>Neste e-mail você encontra o seu contra-cheque referente a ${dataLegivel}.</p>`;
          sendSmtpEmail.sender = {
            name: "Gilberto Krebs",
            email: "gilberto@krebseng.com.br",
          };
          sendSmtpEmail.to = [{ email, name: nome }];
          sendSmtpEmail.headers = { "Some-Custom-Name": "unique-id-1234" };
          sendSmtpEmail.attachment = [
            {
              content: attachment,
              name: "contra-cheque.png",
            },
          ];
          /* apiInstance.sendTransacEmail(sendSmtpEmail).then(
            function (data) {
              console.log(
                "API called successfully. Returned data: " +
                  JSON.stringify(data)
              );
            },
            function (error) {
              console.error(error);
              res.send({ err: "Falha ao enviar os emails" });
            }
          );*/
        }

        res.send({ message: "Emails Enviados com sucesso" });
        console.log("Todos os emails foram enviados com sucesso");
      }
    );
  } catch (err) {
    console.error("-----------------------");
    console.error(err);
    console.error("-----------------------");
    res.send({ err: "Falha ao separar o PDF" });
  }
});

module.exports = router;
