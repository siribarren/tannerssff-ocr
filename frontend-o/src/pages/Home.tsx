import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Configuration,
  SistemaApi,
  type ConciliacionResponse,
} from '../api'
import logo from '../assets/logo.svg'
import { cartola, type CartolaRow } from '../data/cartola'

type MovementStatus = 'conciliado' | 'pendiente' | 'excepcion' | 'rechazado'
type StatusFilter = MovementStatus | 'all'
type SortColumn = 'date' | 'amount' | 'client' | 'status'
type SortDirection = 'asc' | 'desc'
type ResultMode = 'success' | 'failure' | 'pending'

type Movement = {
  date: string
  amount: number
  client: string
  status: MovementStatus
  reference: string
}

type FormValues = {
  nombre: string
  rut: string
  fecha: string
  monto: string
  cuentaDestino: string
}

const sistemaApi = new SistemaApi(
  new Configuration({
    basePath: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  }),
)

const emptyForm: FormValues = {
  nombre: '',
  rut: '',
  fecha: '',
  monto: '',
  cuentaDestino: '',
}

const movementData: Movement[] = [
  { date: '2026-06-16', amount: 1200000, client: 'Automotora XYZ', status: 'conciliado', reference: 'SOL-884103' },
  { date: '2026-06-15', amount: 4500000, client: 'Importadora Sur', status: 'conciliado', reference: 'SOL-771204' },
  { date: '2026-06-14', amount: 670000, client: 'Cliente Directo', status: 'conciliado', reference: 'SOL-330118' },
  { date: '2026-06-12', amount: 3200000, client: 'Mall Central', status: 'conciliado', reference: 'SOL-663200' },
  { date: '2026-06-10', amount: 1250000, client: 'Ferreteria San Jose', status: 'conciliado', reference: 'SOL-552099' },
  { date: '2026-06-09', amount: 760000, client: 'Logistica Andina', status: 'conciliado', reference: 'SOL-441122' },
  { date: '2026-06-07', amount: 980000, client: 'Cafe Central', status: 'conciliado', reference: 'SOL-554433' },
  { date: '2026-06-05', amount: 1450000, client: 'Inversiones del Pacifico', status: 'conciliado', reference: 'SOL-998800' },
  { date: '2026-06-16', amount: 850000, client: 'Cliente ABC', status: 'pendiente', reference: 'PND-552104' },
  { date: '2026-06-13', amount: 1580000, client: 'Inmobiliaria Pacifico', status: 'pendiente', reference: 'PND-884771' },
  { date: '2026-06-07', amount: 780000, client: 'Cliente Retail', status: 'pendiente', reference: 'PND-220877' },
  { date: '2026-06-14', amount: 210000, client: 'Proveedor Norte', status: 'excepcion', reference: 'EXC-118900' },
  { date: '2026-06-08', amount: 520000, client: 'Automotora Delta', status: 'excepcion', reference: 'EXC-440912' },
  { date: '2026-06-15', amount: 990000, client: 'Pago incorrecto', status: 'rechazado', reference: 'REJ-220194' },
  { date: '2026-06-11', amount: 450000, client: 'Transportes del Sur', status: 'rechazado', reference: 'REJ-771004' },
]

const statusMeta: Record<MovementStatus, { label: string; badge: string; action: string; actionClass: string }> = {
  conciliado: {
    label: 'Conciliado',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    action: 'Ver',
    actionClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  pendiente: {
    label: 'Pendiente',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    action: 'Conciliar',
    actionClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
  },
  excepcion: {
    label: 'Excepcion',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    action: 'Revisar',
    actionClass: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
  },
  rechazado: {
    label: 'Rechazado',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    action: 'Revisar',
    actionClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  },
}

const formatMoney = (value: number) => `$${Number(value).toLocaleString('es-CL')}`

const formatPesoInput = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits ? formatMoney(Number(digits)) : ''
}

const formatDisplayDate = (value: string) => {
  if (!value) return '--'
  const [year, month, day] = value.split('-')
  return `${day}-${month}-${year}`
}

const toInputDate = (value?: Date | null) => {
  if (!value) return ''
  return value.toISOString().slice(0, 10)
}

const normalizeRut = (value?: string | null) => {
  const raw = (value ?? '').replace(/[^0-9kK]/g, '').toUpperCase()
  if (raw.length < 2) return raw
  const body = raw.slice(0, -1).replace(/^0+/, '')
  const dv = raw.slice(-1)
  return `${body}-${dv}`
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const findCartolaMatch = (response: ConciliacionResponse) => {
  const fecha = toInputDate(response.fecha)
  const rut = normalizeRut(response.rut)
  const monto = response.monto ?? 0

  return cartola.find(
    (row) => row.fecha === fecha && row.monto === monto && normalizeRut(row.rut) === rut,
  )
}

const getSortValue = (row: Movement, column: SortColumn) => {
  if (column === 'date') return new Date(`${row.date}T00:00:00`).getTime()
  if (column === 'amount') return row.amount
  if (column === 'client') return normalizeText(row.client)
  return statusMeta[row.status].label
}

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [showFileAlert, setShowFileAlert] = useState(false)
  const [processedResponse, setProcessedResponse] = useState<ConciliacionResponse | null>(null)
  const [matchedCartola, setMatchedCartola] = useState<CartolaRow | null>(null)
  const [resultMode, setResultMode] = useState<ResultMode>('success')
  const [currentStep, setCurrentStep] = useState<'request' | 'loader' | 'result'>('request')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)

  const processMutation = useMutation({
    mutationFn: async (imagen: File) => {
      const res: ConciliacionResponse = await sistemaApi.procesarComprobante({ imagen })
      return res
    },
    onSuccess: (res) => {
      const match = findCartolaMatch(res) ?? null
      setProcessedResponse(res)
      setMatchedCartola(match)
      setForm({
        nombre: res.nombre ?? '',
        rut: res.rut ?? '',
        fecha: toInputDate(res.fecha),
        monto: res.monto ? formatMoney(res.monto) : '',
        cuentaDestino: match?.bancoOrigen ?? '',
      })
      setShowFileAlert(false)
    },
  })

  const filteredRows = movementData.filter((row) => {
    const query = normalizeText(search)
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pendiente'
          ? row.status === 'pendiente' || row.status === 'excepcion'
          : row.status === statusFilter
    const matchesSearch =
      !query ||
      normalizeText(row.client).includes(query) ||
      normalizeText(row.reference).includes(query) ||
      normalizeText(formatMoney(row.amount)).includes(query) ||
      normalizeText(statusMeta[row.status].label).includes(query)

    return matchesStatus && matchesSearch
  })

  const sortedRows = [...filteredRows].sort((a, b) => {
    const factor = sortDirection === 'asc' ? 1 : -1
    const aValue = getSortValue(a, sortColumn)
    const bValue = getSortValue(b, sortColumn)

    if (aValue < bValue) return -1 * factor
    if (aValue > bValue) return 1 * factor
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const conciliados = movementData.filter((row) => row.status === 'conciliado')
  const pendientes = movementData.filter((row) => row.status === 'pendiente' || row.status === 'excepcion')
  const rechazados = movementData.filter((row) => row.status === 'rechazado')
  const amount = conciliados.reduce((sum, row) => sum + row.amount, 0)

  const resetRequest = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setForm(emptyForm)
    setShowFileAlert(false)
    setProcessedResponse(null)
    setMatchedCartola(null)
    setResultMode('success')
    setCurrentStep('request')
    processMutation.reset()
  }

  const openModal = () => {
    resetRequest()
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetRequest()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setShowFileAlert(false)
    setProcessedResponse(null)
    setMatchedCartola(null)
    setForm(emptyForm)
    processMutation.reset()

    if (!file) {
      setPreviewUrl('')
      return
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (loadEvent) => {
        setPreviewUrl(typeof loadEvent.target?.result === 'string' ? loadEvent.target.result : '')
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl('')
    }
  }

  const handleProcessImage = () => {
    if (!selectedFile) {
      setShowFileAlert(true)
      return
    }

    processMutation.mutate(selectedFile)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!processedResponse) {
      setShowFileAlert(true)
      return
    }

    setResultMode(matchedCartola ? 'success' : 'failure')
    setCurrentStep('loader')
    window.setTimeout(() => setCurrentStep('result'), 700)
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'date' ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status)
    setPage(1)
  }

  const updateField = (field: keyof FormValues, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === 'monto' ? formatPesoInput(value) : value,
    }))
  }

  const alertTone = processMutation.isError ? 'red' : matchedCartola ? 'green' : processedResponse ? 'amber' : null
  const isProcessing = processMutation.isPending
  const canSubmit = Boolean(processedResponse) && !isProcessing

  return (
    <div className="min-h-screen bg-slate-50 text-[#222222] lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex flex-col justify-between gap-2 bg-gradient-to-b from-tanner-midnight to-tanner-navy px-6 py-7 text-white shadow-tanner">
        <div className="grid gap-3">
          <img className="w-[220px] max-w-full drop-shadow-xl" src={logo} alt="Tanner Servicios Financieros" />
        </div>

        <nav className="grid gap-2">
          <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 font-semibold text-white">Panel</div>
          <a href="#detalle-conciliaciones" className="rounded-lg px-4 py-3 text-white/80 transition hover:bg-white/10 hover:text-white">Conciliaciones</a>
          <div className="rounded-lg px-4 py-3 text-white/80">Pagos</div>
          <div className="rounded-lg px-4 py-3 text-white/80">Excepciones</div>
          <div className="rounded-lg px-4 py-3 text-white/80">Auditoria</div>
          <div className="rounded-lg px-4 py-3 text-white/80">Sincronizacion</div>
          <div className="rounded-lg px-4 py-3 text-white/80">Reportes</div>
          <div className="rounded-lg px-4 py-3 text-white/80">Configuracion</div>
        </nav>

        <div className="mt-auto text-xs text-white/55">v1.0 Prototipo</div>
      </aside>

      <main className="overflow-auto p-5 lg:p-8">
        <section className="mb-5 flex flex-col justify-between gap-6 rounded-lg bg-gradient-to-br from-tanner-midnight to-tanner-medium p-6 text-white shadow-tanner lg:flex-row lg:items-start">
          <div>
            <h1 className="text-4xl font-bold leading-none lg:text-5xl">Conciliacion Bancaria</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-white transition hover:-translate-y-0.5">Exportar</button>
            <button className="rounded-lg bg-tanner-royal px-4 py-3 font-semibold text-white shadow-lg shadow-blue-900/25 transition hover:-translate-y-0.5" onClick={openModal}>+ Nueva Conciliacion</button>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-tanner">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                ['today', 'Hoy'],
                ['week', 'Ultima semana'],
                ['month', 'Ultimo mes'],
                ['range', 'Rango de fechas'],
              ].map(([period, label]) => (
                <button key={period} type="button" className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-tanner-midnight transition hover:bg-slate-200">
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm">
                Ultimo mes · datos de prototipo
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="flex w-fit gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button className="rounded-md bg-tanner-midnight px-4 py-2 text-sm font-semibold text-white">Conciliacion</button>
            <button className="rounded-md px-4 py-2 text-sm text-tanner-gray">Excepciones</button>
            <button className="rounded-md px-4 py-2 text-sm text-tanner-gray">Historial</button>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Pagos recibidos" value={String(movementData.length)} />
            <MetricCard label="Pagos procesados" value={String(conciliados.length + rechazados.length)} />
            <MetricCard label="Conciliados" value={String(conciliados.length)} valueClass="text-emerald-700" />
            <MetricCard label="Pendientes" value={String(pendientes.length)} valueClass="text-amber-700" />
            <MetricCard label="Rechazados" value={String(rechazados.length)} valueClass="text-rose-700" danger />
            <MetricCard label="Monto conciliado" value={formatMoney(amount)} />
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <StatusButton active={statusFilter === 'conciliado'} tone="emerald" onClick={() => handleStatusFilter('conciliado')}>Conciliados</StatusButton>
            <StatusButton active={statusFilter === 'pendiente'} tone="amber" onClick={() => handleStatusFilter('pendiente')}>Pendiente</StatusButton>
            <StatusButton active={statusFilter === 'rechazado'} tone="rose" onClick={() => handleStatusFilter('rechazado')}>Rechazados</StatusButton>
            <button type="button" onClick={() => handleStatusFilter('all')} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${statusFilter === 'all' ? 'border-tanner-midnight bg-tanner-midnight text-white shadow-md shadow-slate-300' : 'border-slate-200 bg-slate-100 text-tanner-midnight hover:bg-slate-200'}`}>Historial</button>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
            <span className="text-tanner-royal">⌕</span>
            <input className="w-full border-0 bg-transparent outline-none" type="text" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar por monto, cliente o referencia..." />
          </div>

          <div id="detalle-conciliaciones" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 p-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-tanner-midnight">Detalle de Conciliaciones</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="text-xs uppercase text-tanner-gray">
                  <tr>
                    <SortableHeader label="Fecha" column="date" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Monto" column="amount" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Cliente" column="client" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
                    <SortableHeader label="Estado" column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
                    <th className="border-b border-slate-200 px-3 py-3">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const meta = statusMeta[row.status]
                    return (
                      <tr key={`${row.reference}-${row.date}`} className="odd:bg-white even:bg-slate-50/60">
                        <td className="border-b border-slate-200 px-3 py-4">{formatDisplayDate(row.date)}</td>
                        <td className="border-b border-slate-200 px-3 py-4 font-semibold text-tanner-midnight">{formatMoney(row.amount)}</td>
                        <td className="border-b border-slate-200 px-3 py-4">{row.client}</td>
                        <td className="border-b border-slate-200 px-3 py-4"><span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${meta.badge}`}>{meta.label}</span></td>
                        <td className="border-b border-slate-200 px-3 py-4"><button className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${meta.actionClass}`}>{meta.action}</button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {visibleRows.length === 0 ? <div className="border-t border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-tanner-gray">No hay movimientos para el filtro seleccionado.</div> : null}

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-tanner-gray">{sortedRows.length === 0 ? '0 movimientos' : `Mostrando ${(currentPage - 1) * pageSize + 1}-${(currentPage - 1) * pageSize + visibleRows.length} de ${sortedRows.length} movimientos`}</p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage(Math.max(1, currentPage - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-tanner-midnight transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Anterior</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={pageNumber === currentPage ? 'rounded-lg bg-tanner-midnight px-3 py-2 text-sm font-semibold text-white shadow-sm' : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-tanner-midnight transition hover:bg-slate-50'}>{pageNumber}</button>
                ))}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(Math.min(totalPages, currentPage + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-tanner-midnight transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Siguiente</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className={`modal-overlay fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md ${isModalOpen ? 'is-open' : ''}`} aria-hidden={!isModalOpen}>
        <div className="pointer-events-none absolute inset-x-3 top-3 z-[85] flex justify-center sm:top-5">
          <div className="w-full max-w-2xl">
            {alertTone ? (
              <div className={`pointer-events-auto rounded-lg border p-4 shadow-xl ${alertTone === 'green' ? 'border-green-200 bg-green-50 text-green-800' : alertTone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-800'}`} role="alert" aria-live="polite">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${alertTone === 'green' ? 'bg-green-600 text-white' : alertTone === 'amber' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'}`}>{alertTone === 'green' ? '✓' : '!'}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-5">{alertTone === 'green' ? 'Datos identificados y conciliados' : alertTone === 'amber' ? 'Datos identificados sin coincidencia' : 'Error procesando imagen'}</h3>
                    <div className="mt-1 text-sm leading-5">{alertTone === 'green' ? 'La respuesta del comprobante coincide con una fila de Cartola.' : alertTone === 'amber' ? 'Los campos fueron completados, pero no se encontro match exacto en Cartola.' : processMutation.error instanceof Error ? processMutation.error.message : 'No fue posible procesar el archivo.'}</div>
                  </div>
                </div>
              </div>
            ) : null}
            {showFileAlert ? (
              <div className="pointer-events-auto mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-xl" role="alert" aria-live="polite">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-600 text-xs font-bold text-white">!</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold leading-5">Debes subir la imagen para pre-procesar</h3>
                    <div className="mt-1 text-sm leading-5">Adjunta un archivo PNG, JPG o PDF para continuar.</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="modal-card flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/60 bg-white p-3 shadow-2xl sm:p-4" role="dialog" aria-modal="true" aria-labelledby="conciliationModalTitle">
          <div className="modal-header mb-3 flex items-start justify-between gap-3 sm:mb-4">
            <div>
              <p className="modal-eyebrow mb-1 text-[11px] uppercase tracking-[0.24em] text-tanner-royal">Solicitud</p>
              <h2 className="text-[1.55rem] font-bold leading-tight text-tanner-midnight sm:text-[1.75rem]" id="conciliationModalTitle">Nueva conciliacion</h2>
            </div>
            <button className="modal-close grid h-9 w-9 place-items-center rounded-full bg-tanner-midnight/10 text-xl text-tanner-midnight" onClick={closeModal} aria-label="Cerrar modal">×</button>
          </div>

          {currentStep === 'request' ? (
            <form className="modal-form flex min-h-0 flex-1 flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
              <div className="form-grid grid gap-3 lg:grid-cols-2">
                <div className="form-field form-field--full grid gap-2 lg:col-span-2">
                  <label className="font-semibold text-tanner-midnight" htmlFor="proofImage">Adjuntar imagen</label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input className="w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-tanner-midnight file:px-4 file:py-2 file:text-white" type="file" id="proofImage" accept="image/*,.pdf" onChange={handleFileChange} />
                    <button type="button" disabled={isProcessing} onClick={handleProcessImage} className="rounded-lg bg-tanner-royal px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300">{isProcessing ? 'Procesando...' : 'Pre-Procesar Imagen'}</button>
                  </div>
                  <div className="image-preview relative grid h-[170px] grid-cols-1 gap-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 sm:h-[185px] md:grid-cols-[40%_minmax(0,1fr)] lg:h-[200px]">
                    <div className="preview-trigger flex h-full min-h-0 items-center justify-center overflow-hidden rounded-md bg-white">
                      {previewUrl ? <img className="preview-image mx-auto block h-auto w-auto max-h-full max-w-full object-contain opacity-90" src={previewUrl} alt="Vista previa de la evidencia" /> : null}
                    </div>
                    <div className="preview-detail relative hidden h-full min-h-0 overflow-hidden rounded-md border border-slate-200 bg-white md:block" aria-hidden="true">
                      {previewUrl ? <div className="h-full w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${previewUrl})` }} /> : null}
                    </div>
                    {!previewUrl ? (
                      <div className="absolute inset-2 grid place-items-center gap-1.5 text-center">
                        <span className="text-sm text-tanner-gray">{selectedFile?.type === 'application/pdf' ? selectedFile.name : 'La imagen seleccionada se mostrara aqui'}</span>
                        <span className="text-[11px] font-medium uppercase tracking-wide text-tanner-gray/80">Formatos aceptados: PNG, JPG, PDF</span>
                      </div>
                    ) : null}
                    {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/35 px-3 backdrop-blur-[2px]" aria-hidden="true">
                        <div className="w-full max-w-xs rounded-2xl border border-white/60 bg-white/95 p-3 shadow-2xl sm:p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 animate-spin rounded-full border-4 border-tanner-royal/20 border-t-tanner-royal" />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-tanner-midnight">Pre-procesando imagen</p>
                              <p className="text-xs text-tanner-gray">Extrayendo datos con FastAPI y OCR.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <InputField label="Nombre" value={form.nombre} placeholder="Nombre y apellido" onChange={(value) => updateField('nombre', value)} />
                <InputField label="RUT" value={form.rut} placeholder="12.345.678-9" onChange={(value) => updateField('rut', value)} />
                <InputField label="Fecha" type="date" value={form.fecha} onChange={(value) => updateField('fecha', value)} />
                <InputField label="Monto" value={form.monto} placeholder="$0" inputMode="numeric" onChange={(value) => updateField('monto', value)} />
                <InputField label="Cuenta Destino" value={form.cuentaDestino} placeholder="Cuenta corriente / numero de cuenta" full onChange={(value) => updateField('cuentaDestino', value)} />
              </div>

              <div className="modal-actions flex flex-wrap justify-end gap-2 pt-0.5">
                <button type="button" className="secondary-btn rounded-lg bg-tanner-midnight/5 px-3.5 py-2.5 font-semibold text-tanner-midnight" onClick={closeModal}>Cancelar</button>
                <button type="button" className="rounded-lg bg-amber-500 px-3.5 py-2.5 font-semibold text-white shadow-lg shadow-amber-900/15 transition hover:bg-amber-600" onClick={() => { setResultMode('pending'); setCurrentStep('result') }}>Dejar pendiente</button>
                <button type="submit" disabled={!canSubmit} className="primary-btn rounded-lg bg-tanner-royal px-3.5 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">Conciliar</button>
              </div>
            </form>
          ) : null}

          {currentStep === 'loader' ? (
            <div className="process-step grid min-h-[260px] place-items-center content-center gap-3 text-center">
              <div className="loader-mark h-14 w-14 rounded-full border-4 border-tanner-royal/20 border-t-tanner-royal" aria-hidden="true" />
              <h3 className="text-xl font-bold text-tanner-midnight">Conciliando</h3>
              <p className="text-sm text-tanner-gray">Estamos cruzando la solicitud contra movimientos de cartola.</p>
            </div>
          ) : null}

          {currentStep === 'result' ? (
            <ResultStep mode={resultMode} form={form} match={matchedCartola} previewUrl={previewUrl} onBack={() => setCurrentStep('request')} onRegister={() => setIsConfirmationOpen(true)} />
          ) : null}
        </div>
      </div>

      <div className={`modal-overlay confirm-overlay fixed inset-0 z-[70] hidden items-center justify-center bg-slate-950/60 p-5 backdrop-blur-md ${isConfirmationOpen ? 'is-open' : ''}`} aria-hidden={!isConfirmationOpen}>
        <div className="confirm-card grid w-full max-w-md justify-items-center gap-4 rounded-lg bg-white p-8 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="confirmationTitle">
          <div className={`confirm-check grid h-14 w-14 place-items-center rounded-full text-xl font-bold text-white ${resultMode === 'success' ? 'bg-green-600' : resultMode === 'pending' ? 'bg-amber-500' : 'bg-red-600'}`}>{resultMode === 'success' ? '✓' : '!'}</div>
          <h2 className="text-2xl font-bold text-tanner-midnight" id="confirmationTitle">{resultMode === 'success' ? 'Conciliacion registrada' : resultMode === 'pending' ? 'Conciliacion registrada como pendiente' : 'Conciliacion rechazada'}</h2>
          <p className="text-tanner-gray">{resultMode === 'success' ? 'La solicitud fue registrada correctamente y quedo asociada a la cartola simulada.' : resultMode === 'pending' ? 'La solicitud fue registrada como pendiente.' : 'La solicitud fue registrada como rechazada.'}</p>
          <button type="button" className="primary-btn rounded-lg bg-tanner-royal px-5 py-3 font-semibold text-white shadow-lg shadow-blue-900/20" onClick={() => { setIsConfirmationOpen(false); closeModal() }}>Finalizar</button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, valueClass = 'text-tanner-midnight', danger = false }: { label: string; value: string; valueClass?: string; danger?: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${danger ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-white' : 'border-slate-200 bg-gradient-to-br from-white to-slate-50'}`}>
      <span className={`text-sm ${danger ? 'text-rose-700' : 'text-tanner-gray'}`}>{label}</span>
      <strong className={`mt-2 block text-3xl ${valueClass}`}>{value}</strong>
    </article>
  )
}

function StatusButton({ active, tone, onClick, children }: { active: boolean; tone: 'emerald' | 'amber' | 'rose'; onClick: () => void; children: React.ReactNode }) {
  const styles = {
    emerald: active ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    amber: active ? 'border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    rose: active ? 'border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-200' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  }

  return <button type="button" onClick={onClick} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${styles[tone]}`}>{children}</button>
}

function SortableHeader({ label, column, activeColumn, direction, onSort }: { label: string; column: SortColumn; activeColumn: SortColumn; direction: SortDirection; onSort: (column: SortColumn) => void }) {
  const active = column === activeColumn
  return (
    <th className="border-b border-slate-200 px-3 py-3" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(column)} className="flex items-center gap-1 font-semibold text-tanner-gray transition hover:text-tanner-midnight" aria-label={`Ordenar por ${label}`}>
        <span className="flex items-center">{label}<span className={`ms-1 text-sm transition ${active ? 'text-tanner-midnight' : 'text-slate-300'}`}>↕</span></span>
      </button>
    </th>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', inputMode, full = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; inputMode?: 'numeric'; full?: boolean }) {
  return (
    <div className={`form-field grid gap-1.5 ${full ? 'lg:col-span-2' : ''}`}>
      <label className="font-semibold text-tanner-midnight">{label}</label>
      <input className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-tanner-royal focus:ring-4 focus:ring-blue-100" type={type} value={value} placeholder={placeholder} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function ResultStep({ mode, form, match, previewUrl, onBack, onRegister }: { mode: ResultMode; form: FormValues; match: CartolaRow | null; previewUrl: string; onBack: () => void; onRegister: () => void }) {
  const isSuccess = mode === 'success'
  const isPending = mode === 'pending'
  const amount = form.monto || '--'

  if (isPending) {
    return (
      <div className="result-step grid gap-4">
        <div className="result-banner flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="result-icon grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 font-bold text-amber-600">!</span>
          <div>
            <h3 className="text-base font-bold text-tanner-midnight">Conciliacion pendiente de revision</h3>
            <p className="mt-0.5 text-sm text-tanner-gray">La evidencia quedo marcada para revision manual.</p>
          </div>
        </div>
        <div className="comparison-grid grid gap-3 lg:grid-cols-2">
          <section className="comparison-panel rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="mb-3 font-bold text-tanner-midnight">Evidencia</h4>
            <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-2">
              {previewUrl ? <img className="max-h-full max-w-full object-contain" src={previewUrl} alt="Imagen enviada para revision" /> : <span className="text-sm text-tanner-gray">Archivo adjunto</span>}
            </div>
          </section>
          <section className="comparison-panel rounded-lg border border-slate-200 bg-sky-50 p-4">
            <h4 className="mb-3 font-bold text-tanner-midnight">Estado</h4>
            <SummaryRow label="Resultado" value="Pendiente de revision" />
            <SummaryRow label="Accion" value="Revision manual" />
            <SummaryRow label="Referencia" value="SOL-2026-08421" last />
          </section>
        </div>
        <ResultActions onBack={onBack} onRegister={onRegister} />
      </div>
    )
  }

  return (
    <div className="result-step grid gap-4">
      <div className={`result-banner flex items-center gap-3 rounded-lg border p-3 ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <span className={`result-icon grid h-9 w-9 shrink-0 place-items-center rounded-full font-bold text-white ${isSuccess ? 'bg-green-600' : 'bg-red-600'}`}>{isSuccess ? '✓' : 'X'}</span>
        <div>
          <h3 className="text-base font-bold text-tanner-midnight">{isSuccess ? 'Monto correctamente conciliado' : 'Monto no encontrado'}</h3>
          <p className="mt-0.5 text-sm text-tanner-gray">{isSuccess ? 'Se encontro una coincidencia consistente entre la solicitud y la cartola bancaria.' : 'No se encontraron coincidencias consistentes entre la solicitud y la cartola bancaria.'}</p>
        </div>
      </div>

      <div className="comparison-grid grid gap-3 lg:grid-cols-2">
        <section className={`comparison-panel rounded-lg border bg-white p-4 ${isSuccess ? 'border-slate-200' : 'border-red-200'}`}>
          <h4 className="mb-3 font-bold text-tanner-midnight">Datos a conciliar</h4>
          <dl className="grid gap-2.5">
            <SummaryRow label="Monto" value={amount} />
            <SummaryRow label="Nombre" value={form.nombre || '--'} />
            <SummaryRow label="RUT" value={form.rut || '--'} />
            <SummaryRow label="Fecha" value={formatDisplayDate(form.fecha)} />
            <SummaryRow label="Cuenta Destino" value={form.cuentaDestino || '--'} />
            <SummaryRow label="Referencia" value="SOL-2026-08421" last />
          </dl>
        </section>

        {isSuccess ? (
          <section className="comparison-panel cartola-panel rounded-lg border border-slate-200 bg-sky-50 p-4">
            <h4 className="mb-3 font-bold text-tanner-midnight">Datos desde cartola</h4>
            <dl className="grid gap-2.5">
              <SummaryRow label="Monto cartola" value={match ? formatMoney(match.monto) : amount} />
              <SummaryRow label="Banco origen" value={match?.bancoOrigen ?? '--'} />
              <SummaryRow label="Fecha abono" value={match ? formatDisplayDate(match.fecha) : '--'} />
              <SummaryRow label="Hora movimiento" value={match?.horaMovimiento ?? '--'} />
              <SummaryRow label="N° operacion" value={match?.numeroOperacion ?? '--'} last />
            </dl>
          </section>
        ) : null}
      </div>

      <ResultActions onBack={onBack} onRegister={onRegister} />
    </div>
  )
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${last ? '' : 'border-b border-slate-100 pb-2.5'}`}>
      <dt className="text-tanner-gray">{label}</dt>
      <dd className="text-right font-bold text-[#222222]">{value}</dd>
    </div>
  )
}

function ResultActions({ onBack, onRegister }: { onBack: () => void; onRegister: () => void }) {
  return (
    <div className="modal-actions flex flex-wrap justify-end gap-2">
      <button type="button" className="secondary-btn rounded-lg bg-tanner-midnight/5 px-3.5 py-2.5 font-semibold text-tanner-midnight" onClick={onBack}>Volver</button>
      <button type="button" className="primary-btn rounded-lg bg-tanner-royal px-3.5 py-2.5 font-semibold text-white shadow-lg shadow-blue-900/20" onClick={onRegister}>Registrar</button>
    </div>
  )
}

export default Home
