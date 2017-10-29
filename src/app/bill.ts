import { Storitev } from './storitev';

export interface Bill {
    _id: string;
    stranka: string;
    davcnaSt: string;
    naslov: string;
    postnaSt: string;
    mesto: string;
    drzava: string;
    datumIzdaje: string;
    datumStoritve: string;
    rokPlacila: string;
    storitve: Storitev[];
    stRacuna: string;
    znesek: string;
    vpisal: string;
}
