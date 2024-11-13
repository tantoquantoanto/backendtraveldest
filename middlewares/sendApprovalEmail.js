const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendApprovalEmail = async ({ email, name, approved }) => {
  const subject = approved
    ? "Destinazione approvata con successo"
    : "Destinazione non approvata";
  const text = approved
    ? `Ciao ${name},\n\nI nostri admin hanno approvato la destinazione da te proposta. Ti ringraziamo per il tuo contributo e speriamo tu possa continuare ad arricchire la nostra piattaforma.`
    : `Ciao ${name},\n\nLa destinazione da te proposta non è stata approvata dai nostri admin. Ti invitiamo a rivedere i criteri di pubblicazione e a inviare una nuova proposta.`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_SENDER,
    subject: subject,
    text: text,
  };

  try {
    console.log("Tentativo di invio email a:", email);
    await sgMail.send(msg);
    console.log("Email inviata con successo.");
  } catch (error) {
    console.error("Errore nell'invio dell'email:", error.response ? error.response.body : error);
    throw new Error("Errore nell'invio dell'email");
  }
};


module.exports = sendApprovalEmail;
