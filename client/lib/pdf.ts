// Minimal typings
declare global {
  interface Window {
    pdfMake?: any;
  }
}

export function stripHtml(html: string = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || "";
  return text.replace(/\u00A0/g, " ").trim();
}
export function fmtList(arr: any) {
  if (!arr) return "";
  return Array.isArray(arr) ? arr.join(", ") : String(arr);
}
export function todayFR() {
  return new Date().toLocaleDateString("fr-FR");
}

// Logo config
const FPSG_LOGO_URL =
  "https://cdn.builder.io/api/v1/image/assets%2Fd93d9a0ec7824aa1ac4d890a1f90a2ec%2Fef588347db774ea5a9418f8ecbbd8909?format=webp&width=300";
let FPSG_LOGO_DATAURL: string | null = null;

async function ensureLogo(): Promise<string | null> {
  if (FPSG_LOGO_DATAURL) return FPSG_LOGO_DATAURL;
  if (!FPSG_LOGO_URL) return null;
  try {
    const resp = await fetch(FPSG_LOGO_URL);
    const blob = await resp.blob();
    const reader = new FileReader();
    const p = new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(String(reader.result));
    });
    reader.readAsDataURL(blob);
    FPSG_LOGO_DATAURL = await p;
  } catch {
    FPSG_LOGO_DATAURL = null;
  }
  return FPSG_LOGO_DATAURL;
}

export async function generateProposalPDF({
  formation,
  prospect,
  contact,
  template,
  sales,
  costOverride,
}: any) {
  const pdfMake = window.pdfMake;
  if (!pdfMake) throw new Error("pdfMake non chargé");

  const title = formation?.title || "Proposition de formation";
  const domain = formation?.domain || "";
  const duration = formation?.duration || "";
  const formats = fmtList(formation?.format);
  const audiences = fmtList(formation?.audiences);
  const sectors = fmtList(formation?.sectors);
  const objectives = stripHtml(formation?.objectives || "");
  const price =
    (formation?.price_estimate && String(formation.price_estimate).trim()) ||
    costOverride ||
    "Sur devis";
  const company = prospect?.company_name || "";
  const accroche = template?.email_body
    ? decodeURIComponent(template.email_body).replace(/%0D%0A/g, "\n")
    : "";
  const seller = {
    name: sales?.yourName || "",
    email: sales?.yourEmail || "",
    phone: sales?.yourPhone || "",
  };

  const coverStack: any[] = [];
  const LOGO = await ensureLogo();
  if (LOGO) {
    coverStack.push({
      image: LOGO,
      width: 140,
      alignment: "left",
      margin: [0, 0, 0, 16],
    });
  } else {
    coverStack.push({ text: "FPSG", style: "brand" });
  }
  coverStack.push(
    { text: "Proposition de formation", style: "h1", margin: [0, 6, 0, 0] },
    { text: title, style: "h2", margin: [0, 2, 0, 16] },
    { text: `Client : ${company}`, style: "meta" },
    { text: `Date : ${todayFR()}`, style: "meta" },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 10,
          x2: 515,
          y2: 10,
          lineWidth: 1,
          lineColor: "#e5e7eb",
        },
      ],
      margin: [0, 8, 0, 16],
    },
  );

  const descr: any[] = [];
  if (accroche) {
    descr.push({
      text: "Contexte & approche",
      style: "h3",
      margin: [0, 0, 0, 6],
    });
    descr.push({
      text: accroche.replace(/\n{3,}/g, "\n\n"),
      style: "p",
      margin: [0, 0, 0, 12],
    });
  }
  descr.push(
    { text: "Description du module", style: "h3", margin: [0, 0, 0, 6] },
    {
      text: objectives || "Objectifs détaillés à préciser lors du cadrage.",
      style: "p",
    },
  );

  const infoGrid = [
    [
      { text: "Domaine", style: "label" },
      { text: domain || "—", style: "cell" },
    ],
    [
      { text: "Durée", style: "label" },
      { text: duration || "—", style: "cell" },
    ],
    [
      { text: "Format(s)", style: "label" },
      { text: formats || "—", style: "cell" },
    ],
    [
      { text: "Public(s)", style: "label" },
      { text: audiences || "—", style: "cell" },
    ],
    [
      { text: "Secteur(s) cible(s)", style: "label" },
      { text: sectors || "—", style: "cell" },
    ],
    [
      { text: "Coût indicatif", style: "label" },
      { text: price, style: "cell" },
    ],
  ];

  const contactBlock = [
    { text: "Contact commercial", style: "h3", margin: [0, 0, 0, 6] },
    {
      columns: [
        [
          { text: seller.name || "—", style: "p" },
          { text: seller.email || "—", style: "p" },
          { text: seller.phone || "—", style: "p" },
        ],
        [
          { text: "Prospect", style: "smallLabel" },
          { text: company || "—", style: "p" },
          {
            text: `${prospect?.sector || "—"} • ${prospect?.region || "—"}`,
            style: "p",
          },
          contact?.email
            ? { text: contact.email, style: "p" }
            : { text: "", margin: [0, 0, 0, 0] },
        ],
      ],
      columnGap: 24,
    },
  ];

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [36, 48, 36, 60],
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: "Fiducial FPSG — Formation Prévention Sûreté Gestion",
          alignment: "left",
          style: "footer",
        },
        {
          text: `Page ${currentPage} / ${pageCount}`,
          alignment: "right",
          style: "footer",
        },
      ],
      margin: [36, 0, 36, 24],
    }),
    content: [
      { stack: coverStack },
      { text: "—", color: "#fff", margin: [0, 4] },
      {
        table: { widths: [160, "*"], body: infoGrid },
        layout: {
          fillColor: (row: number) => (row % 2 === 0 ? null : "#fafafa"),
          hLineColor: "#e5e7eb",
          vLineColor: "#e5e7eb",
        },
        margin: [0, 0, 0, 16],
      },
      ...descr,
      { text: "", margin: [0, 12, 0, 12] },
      ...contactBlock,
    ],
    styles: {
      brand: { fontSize: 14, bold: true, color: "#111827" },
      h1: { fontSize: 20, bold: true, color: "#111827" },
      h2: { fontSize: 16, bold: true, color: "#111827" },
      h3: { fontSize: 12, bold: true, color: "#111827" },
      meta: { fontSize: 10, color: "#374151" },
      p: { fontSize: 11, color: "#111827", lineHeight: 1.25 },
      label: {
        fontSize: 10,
        bold: true,
        color: "#374151",
        margin: [0, 2, 8, 2],
      },
      cell: { fontSize: 11, color: "#111827", margin: [0, 2, 0, 2] },
      smallLabel: { fontSize: 10, bold: true, color: "#6b7280" },
      footer: { fontSize: 9, color: "#6b7280" },
    },
    defaultStyle: { fontSize: 11 },
  } as any;

  const filename = `Proposition_FPSG_${company ? company.replace(/[^a-z0-9-_]/gi, "_") + "_" : ""}${title.replace(/[^a-z0-9-_]/gi, "_")}.pdf`;
  pdfMake.createPdf(docDefinition).download(filename);
}
