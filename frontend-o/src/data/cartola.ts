export type CartolaRow = {
  fecha: string
  nombre: string
  rut: string
  monto: number
  bancoOrigen: string
  horaMovimiento: string
  numeroOperacion: string
}

export const cartola: CartolaRow[] = [
  {
    fecha: '2025-02-28',
    nombre: 'Cesar Augusto',
    rut: '26654992-K',
    monto: 100000,
    bancoOrigen: 'Banco de Chile',
    horaMovimiento: '10:42',
    numeroOperacion: 'BCH-88410322',
  },
  {
    fecha: '2020-09-16',
    nombre: 'Ana Isabel Andrade',
    rut: '14131034-8',
    monto: 99000,
    bancoOrigen: 'Coopeuch',
    horaMovimiento: '12:18',
    numeroOperacion: 'COO-55129018',
  },
  {
    fecha: '2016-11-25',
    nombre: 'VARELA ESPINOZA ADOLFO ARHANDO',
    rut: '007278201-1',
    monto: 1857188,
    bancoOrigen: 'BancoEstado',
    horaMovimiento: '09:07',
    numeroOperacion: 'BE-77128840',
  },
]
