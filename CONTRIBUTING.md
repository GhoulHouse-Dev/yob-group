# Kehittäminen

Tee toiminnalliset muutokset omaan haaraan ja avaa pull request. Pidä palvelu- ja yhteyshenkilötiedot `lib/site.ts`-tiedostossa. Älä lisää vahvistamattomia referenssejä, sertifikaatteja, hintoja, toimialueita tai toimituslupauksia.

Aja ennen pull requestia:

```sh
pnpm typecheck
pnpm lint --max-warnings 0
pnpm test
pnpm build
```

Testaa muuttunut polku näppäimistöllä sekä mobiilissa. Lomakkeen lähetyksen testeissä käytetään aina korvattua sähköpostipalvelua ja synteettisiä tietoja. Älä käytä oikeita asiakkaiden tietoja testiympäristössä.

Säilytä `pnpm-lock.yaml`, riippuvuuksien build-allowlist ja Inter-fontin lisenssi. Älä lisää avaimia lähdekoodiin. Käyttöönotto tapahtuu hyväksytystä commitista; tuotantoon palaaminen tehdään julkaisemalla edellinen toimiva versio uudelleen.
