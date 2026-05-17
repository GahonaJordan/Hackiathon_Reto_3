"use client";

import { useEffect, useState, type FormEvent } from "react";

type HospitalOption = {
  name: string;
  specialty: string;
  price: number;
  inNetwork: boolean;
  estimatedCopay: number;
};

type EstimateResponse = {
  error: boolean;
  message?: string;
  summary?: string;
  specialty?: string;
  patient?: {
    name: string;
    plan: string;
  };
  benefit?: {
    coverage: number;
    minimumCopay: number;
  };
  hospitalOptions?: HospitalOption[];
  bestHospital?: HospitalOption;
};

type ConsultationRecord = {
  id: string;
  createdAt: string;
  symptom: string;
  specialty: string;
  hospitalName: string;
  hospitalPrice: number;
  copay: number;
  coverage: number;
  inNetwork: boolean;
  summary: string;
};

type FakePatient = {
  name: string;
  patientId: string;
  password: string;
  plan: string;
};

const sampleSymptoms = [
  "Dolor opresivo en el pecho al subir escaleras",
  "Erupción con picazón en brazos y cuello",
  "Ansiedad intensa y dificultad para dormir",
];

const fakePatient: FakePatient = {
  name: "Juan Perez",
  patientId: "PAC-001",
  password: "1234",
  plan: "Premium",
};

const AUTH_STORAGE_KEY = "medicover-auth";
const HISTORY_STORAGE_KEY = "medicover-consultation-history";

export default function Home() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [message, setMessage] = useState(sampleSymptoms[0]);
  const [responseData, setResponseData] = useState<EstimateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ConsultationRecord[]>(() => {
    if (typeof window === "undefined") return [];

    const storedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!storedHistory) return [];

    try {
      const parsed = JSON.parse(storedHistory) as ConsultationRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
      return [];
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;

    const storedAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedAuth) return false;

    try {
      const parsed = JSON.parse(storedAuth) as { isAuthenticated?: boolean };
      return Boolean(parsed.isAuthenticated);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const [patientId, setPatientId] = useState(fakePatient.patientId);
  const [password, setPassword] = useState(fakePatient.password);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated }));
  }, [isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    if (patientId === fakePatient.patientId && password === fakePatient.password) {
      setIsAuthenticated(true);
      return;
    }

    setAuthError("Credenciales inválidas. Usa PAC-001 y 1234 para la demo.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setResponseData(null);
    setError(null);
  };

  const persistConsultation = (symptom: string, result: EstimateResponse) => {
    if (!result.bestHospital || !result.specialty || !result.benefit) return;

    const consultation: ConsultationRecord = {
      id:
        globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      symptom,
      specialty: result.specialty,
      hospitalName: result.bestHospital.name,
      hospitalPrice: result.bestHospital.price,
      copay: result.bestHospital.estimatedCopay,
      coverage: result.benefit.coverage,
      inNetwork: result.bestHospital.inNetwork,
      summary: result.summary ?? "Consulta estimada",
    };

    setHistory((currentHistory) => [consultation, ...currentHistory].slice(0, 10));
  };

  const sendMessage = async (value: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value }),
      });

      const data = (await res.json()) as EstimateResponse;

      if (data.error) {
        setError(data.message ?? "No se pudo procesar la solicitud");
        setResponseData(null);
      } else {
        setResponseData(data);
        persistConsultation(value, data);
      }
    } catch {
      setError("No se pudo conectar con el estimador.");
      setResponseData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(message);
  };

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-slate-600">Cargando MediCover AI...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(240,249,255,0.95),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] px-6 py-10 text-slate-900">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">MediCover AI</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Ingresa como paciente para ver tu beneficio antes de atenderte
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Esta demo usa un login ficticio para proteger la experiencia y guardar el historial de consultas del paciente en el navegador.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Login fake de paciente",
                "Historial local de consultas",
                "Copago estimado por red y plan",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)] md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Acceso paciente</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Sesión de demostración</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Usa las credenciales mock del paciente de ejemplo.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="patient-id">
                  ID de paciente
                </label>
                <input
                  id="patient-id"
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  placeholder="PAC-001"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-cyan-400"
                  placeholder="1234"
                />
              </div>

              {authError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {authError}
                </div>
              ) : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Entrar a la demo
              </button>

              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                Paciente demo: {fakePatient.name} | Plan: {fakePatient.plan}
              </div>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(240,249,255,0.95),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/75 px-6 py-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">MediCover AI</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Estimador agéntico de copago y cobertura para el paciente
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Describe el síntoma, el asistente infiere la especialidad, cruza la cobertura del plan y
              te muestra el hospital de la red con menor costo estimado.
            </p>
          </div>

          <div className="grid gap-3 text-sm md:min-w-72 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
              <div className="text-slate-300">Cobertura</div>
              <div className="mt-1 text-xl font-semibold">90%</div>
            </div>
            <div className="rounded-2xl bg-cyan-600 px-4 py-3 text-white">
              <div className="text-cyan-100">Red priorizada</div>
              <div className="mt-1 text-xl font-semibold">Hospitales aliados</div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-slate-950 shadow-sm md:col-span-2">
              <div className="text-slate-500">Paciente autenticado</div>
              <div className="mt-1 text-lg font-semibold">{fakePatient.name}</div>
              <div className="text-sm text-slate-600">ID {fakePatient.patientId} · {fakePatient.plan}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:col-span-2"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] md:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Entrada del paciente</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Síntoma y contexto</h2>
              </div>
              <div className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800">
                Plan activo: Premium
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                className="min-h-40 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
                rows={6}
                placeholder="Describe tus síntomas con el mayor detalle posible..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                {sampleSymptoms.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setMessage(example)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    {example}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Calculando copago..." : "Estimar especialidad, copago y hospital"}
              </button>
            </form>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Triage",
                  copy: "El agente interpreta el síntoma y sugiere la especialidad.",
                },
                {
                  title: "2. Cobertura",
                  copy: "Cruza el plan con la red y la cobertura del beneficio.",
                },
                {
                  title: "3. Ahorro",
                  copy: "Ordena hospitales por el menor copago estimado.",
                },
              ].map((step) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-[2rem] border border-cyan-100 bg-slate-950 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)] md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Resultado</p>

            {error ? (
              <div className="mt-6 rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm leading-6 text-red-100">
                {error}
              </div>
            ) : responseData?.bestHospital ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                  <div className="text-sm text-slate-300">Especialidad sugerida</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{responseData.specialty}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{responseData.summary}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-white/10 p-5">
                    <div className="text-sm text-slate-300">Cobertura</div>
                    <div className="mt-2 text-3xl font-semibold">{responseData.benefit?.coverage ?? 0}%</div>
                    <div className="mt-2 text-sm text-slate-300">Mínimo copago: ${responseData.benefit?.minimumCopay ?? 0}</div>
                  </div>

                  <div className="rounded-3xl bg-cyan-500/15 p-5 ring-1 ring-cyan-400/30">
                    <div className="text-sm text-cyan-100">Mejor hospital</div>
                    <div className="mt-2 text-xl font-semibold text-white">{responseData.bestHospital.name}</div>
                    <div className="mt-2 text-sm text-cyan-100">
                      Copago estimado: ${responseData.bestHospital.estimatedCopay}
                    </div>
                    <div className="mt-1 text-sm text-cyan-100/80">
                      {responseData.bestHospital.inNetwork ? "Dentro de la red" : "Fuera de la red"}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-5 text-slate-950">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Ranking de hospitales</h3>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                      Menor costo primero
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {responseData.hospitalOptions?.map((hospital, index) => (
                      <div
                        key={`${hospital.name}-${index}`}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold">{hospital.name}</div>
                            <div className="mt-1 text-sm text-slate-500">{hospital.specialty}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-slate-950">${hospital.estimatedCopay}</div>
                            <div className="text-xs text-slate-500">Copago estimado</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                          <span className={`rounded-full px-2.5 py-1 ${hospital.inNetwork ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {hospital.inNetwork ? "En red" : "Fuera de red"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                            Precio base: ${hospital.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm leading-6 text-slate-300">
                Ingresa un síntoma para ver la especialidad sugerida, el hospital más conveniente y el copago exacto estimado.
              </div>
            )}
          </aside>
        </div>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Historial</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Consultas recientes</h2>
            </div>
            <p className="text-sm text-slate-500">
              {history.length} consulta{history.length === 1 ? "" : "s"} guardada{history.length === 1 ? "" : "s"}
            </p>
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
              Aún no hay consultas guardadas. Cuando hagas una estimación, aparecerá aquí con fecha, hospital sugerido y copago.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {history.map((item) => (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                        {item.specialty}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.hospitalName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-slate-950">${item.copay}</div>
                      <div className="text-xs text-slate-500">Copago</div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.symptom}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                      Cobertura {item.coverage}%
                    </span>
                    <span className={`rounded-full px-3 py-1 ${item.inNetwork ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {item.inNetwork ? "En red" : "Fuera de red"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                      Precio base ${item.hospitalPrice}
                    </span>
                  </div>

                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {new Date(item.createdAt).toLocaleString("es-ES")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}