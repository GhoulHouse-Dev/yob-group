export const company = { name: "YOB Group Oy", businessId: "3573940-3" };
export const contacts = [
  {
    name: "Sami Pentikäinen",
    role: "Injektointi, korjaus- ja betonirakentaminen",
    phone: "045 3509 738",
    tel: "+358453509738",
    email: "sami@yob.fi",
    initials: "SP",
  },
  {
    name: "Tuomo Salo",
    role: "Injektointi, korjaus- ja betonirakentaminen",
    phone: "045 2287 024",
    tel: "+358452287024",
    email: "tuomo@yob.fi",
    initials: "TS",
  },
  {
    name: "Jaanus Tints",
    role: "Timanttiporaus ja siivouspalvelut",
    phone: "045 1468 959",
    tel: "+358451468959",
    email: "jaanus@yob.fi",
    initials: "JT",
  },
];
export const services = [
  {
    slug: "injektointi",
    title: "Injektointi ja tiivistys",
    short:
      "Betonirakenteiden halkeamien korjaus, vesivuotojen tiivistys ja kapillaarikatkot.",
    image: "injektointi.webp",
    label: "INJEKTOINTI",
    needs: [
      "Betonirakenteiden halkeamat",
      "Rakenteiden vesivuodot",
      "Kapillaarikatkot",
    ],
    intro:
      "Injektointi ja rakenteiden tiivistys kuuluvat YOB:n korjausrakentamisen palveluihin.",
    description:
      "Kerro, millaisessa rakenteessa ongelma on havaittu ja missä vuoto tai halkeama sijaitsee. Kuvista ja mahdollisista suunnitelmista on apua lähtötilanteen kuvaamisessa.",
  },
  {
    slug: "vedeneristys",
    title: "Vedeneristys",
    short: "Ruiskutettava vedeneristys osana rakenteiden suojaamista.",
    image: "vedeneristys.webp",
    label: "VEDENERISTYS",
    needs: ["Ruiskutettava vedeneristys", "Rakenteiden suojaaminen"],
    intro: "YOB:n palveluihin kuuluu ruiskutettava vedeneristys.",
    description:
      "Kuvaa käsiteltävä rakenne, kohteen sijainti ja työn tarve. Käytettävä järjestelmä ja sen soveltuvuus on täsmennettävä kohteen perusteella.",
  },
  {
    slug: "rakennekorjaukset",
    title: "Rakennekorjaukset ja vahvistukset",
    short: "Rakenteiden korjaus, tiivistys ja vahvistaminen.",
    image: "betonirakentaminen.webp",
    label: "RAKENNEKORJAUKSET",
    needs: [
      "Rakenteiden korjaus",
      "Rakenteiden tiivistäminen",
      "Rakenteiden vahvistaminen",
    ],
    intro:
      "YOB Group Oy on erikoistunut rakenteiden korjaamiseen, tiivistämiseen ja vahvistamiseen.",
    description:
      "Kerro rakenteen nykyisestä kunnosta ja korjaustarpeesta. Voit liittää olemassa olevia suunnitelmia tai kuvia kohteesta.",
  },
  {
    slug: "vaestonsuojat",
    title: "Väestönsuojat",
    short:
      "Tarkastukset, tiiveyskokeet, korjaukset ja käyttöönottoon liittyvät työt.",
    label: "VÄESTÖNSUOJAT",
    needs: [
      "Tarkastukset",
      "Tiiveyskokeet",
      "Korjaustyöt",
      "Käyttöönottoon liittyvät työt",
    ],
    intro:
      "YOB:n palveluihin kuuluvat väestönsuojiin liittyvät tarkastus- ja korjaustyöt.",
    description:
      "Kerro väestönsuojan sijainti ja mitä työtä tai selvitystä kohteeseen tarvitaan. Voit liittää aiempia tarkastusasiakirjoja lähtötiedoiksi.",
  },
  {
    slug: "betonirakentaminen",
    title: "Betonirakentaminen",
    short: "Muotti-, raudoitus- ja betonointityöt.",
    image: "betonirakentaminen.webp",
    label: "BETONIRAKENTAMINEN",
    needs: ["Muottityöt", "Raudoitukset", "Betonoinnit"],
    intro: "YOB toteuttaa betonirakentamisen töitä.",
    description:
      "Kuvaa rakennettava rakenne, työn laajuus ja kohteen sijainti. Olemassa olevat piirustukset auttavat työn sisällön kuvaamisessa.",
  },
  {
    slug: "timanttityot",
    title: "Timanttityöt",
    short: "Timanttiporaus ja timanttisahaus korjaus- ja saneerauskohteisiin.",
    label: "TIMANTTITYÖT",
    needs: ["Timanttiporaus", "Timanttisahaus"],
    intro:
      "Timanttiporaus ja -sahaus täydentävät YOB:n rakennus- ja korjauspalveluita.",
    description:
      "Kerro työstettävä materiaali, tarvittavien aukkojen tai sahausten määrä ja tiedossa olevat mitat.",
  },
  {
    slug: "saneeraukset",
    title: "Saneeraukset ja tilamuutokset",
    short: "Saneeraus- ja tilamuutostyöt olemassa oleviin rakennuksiin.",
    label: "SANEERAUKSET",
    needs: ["Saneeraustyöt", "Tilamuutokset"],
    intro: "YOB:n palveluihin kuuluvat saneeraukset ja tilamuutokset.",
    description:
      "Kerro tilan nykyinen käyttötarkoitus, suunniteltu muutos ja työn laajuus. Suunnitelmia voi toimittaa lähtötietojen mukana.",
  },
];
export const steps = [
  {
    title: "Kerro kohteestasi",
    text: "Ilmoita paikkakunta ja kuvaa korjaustarve. Voit kertoa kohteen tyypin, ongelman sijainnin ja sen, milloin havainto on tehty.",
  },
  {
    title: "Lisää lähtötiedot",
    text: "Kuvat, suunnitelmat ja toivottu ajankohta auttavat kuvaamaan tarpeen. Voit jättää pyynnön myös pelkän kuvauksen perusteella.",
  },
  {
    title: "Jätä yhteystietosi",
    text: "Anna puhelinnumero tai sähköpostiosoite. Sopivaa palvelua tai korjausmenetelmää ei tarvitse tietää etukäteen.",
  },
];
