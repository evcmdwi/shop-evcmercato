export interface City {
  id: string
  name: string
}

export interface Province {
  id: string
  name: string
  cities: City[]
}

export const regions: Province[] = [
  {
    id: "11",
    name: "Aceh",
    cities: [
      { id: "1101", name: "Kab. Aceh Selatan" },
      { id: "1102", name: "Kab. Aceh Tenggara" },
      { id: "1171", name: "Kota Banda Aceh" },
      { id: "1172", name: "Kota Sabang" },
    ]
  },
  {
    id: "12",
    name: "Sumatera Utara",
    cities: [
      { id: "1201", name: "Kab. Asahan" },
      { id: "1271", name: "Kota Medan" },
      { id: "1272", name: "Kota Pematangsiantar" },
      { id: "1275", name: "Kota Binjai" },
    ]
  },
  {
    id: "13",
    name: "Sumatera Barat",
    cities: [
      { id: "1301", name: "Kab. Agam" },
      { id: "1371", name: "Kota Padang" },
      { id: "1372", name: "Kota Solok" },
    ]
  },
  {
    id: "14",
    name: "Riau",
    cities: [
      { id: "1401", name: "Kab. Bengkalis" },
      { id: "1471", name: "Kota Pekanbaru" },
      { id: "1473", name: "Kota Dumai" },
    ]
  },
  {
    id: "15",
    name: "Jambi",
    cities: [
      { id: "1501", name: "Kab. Batanghari" },
      { id: "1571", name: "Kota Jambi" },
    ]
  },
  {
    id: "16",
    name: "Sumatera Selatan",
    cities: [
      { id: "1601", name: "Kab. Ogan Komering Ulu" },
      { id: "1671", name: "Kota Palembang" },
      { id: "1672", name: "Kota Prabumulih" },
    ]
  },
  {
    id: "18",
    name: "Lampung",
    cities: [
      { id: "1801", name: "Kab. Lampung Selatan" },
      { id: "1871", name: "Kota Bandar Lampung" },
      { id: "1872", name: "Kota Metro" },
    ]
  },
  {
    id: "31",
    name: "DKI Jakarta",
    cities: [
      { id: "3171", name: "Kota Jakarta Selatan" },
      { id: "3172", name: "Kota Jakarta Timur" },
      { id: "3173", name: "Kota Jakarta Pusat" },
      { id: "3174", name: "Kota Jakarta Barat" },
      { id: "3175", name: "Kota Jakarta Utara" },
    ]
  },
  {
    id: "32",
    name: "Jawa Barat",
    cities: [
      { id: "3201", name: "Kab. Bogor" },
      { id: "3204", name: "Kab. Bandung" },
      { id: "3271", name: "Kota Bogor" },
      { id: "3273", name: "Kota Bandung" },
      { id: "3276", name: "Kota Depok" },
      { id: "3277", name: "Kota Cimahi" },
      { id: "3278", name: "Kota Tasikmalaya" },
      { id: "3279", name: "Kota Cirebon" },
    ]
  },
  {
    id: "33",
    name: "Jawa Tengah",
    cities: [
      { id: "3301", name: "Kab. Cilacap" },
      { id: "3302", name: "Kab. Banyumas" },
      { id: "3371", name: "Kota Magelang" },
      { id: "3372", name: "Kota Surakarta" },
      { id: "3373", name: "Kota Salatiga" },
      { id: "3374", name: "Kota Semarang" },
    ]
  },
  {
    id: "34",
    name: "DI Yogyakarta",
    cities: [
      { id: "3401", name: "Kab. Kulon Progo" },
      { id: "3402", name: "Kab. Bantul" },
      { id: "3404", name: "Kab. Sleman" },
      { id: "3471", name: "Kota Yogyakarta" },
    ]
  },
  {
    id: "35",
    name: "Jawa Timur",
    cities: [
      { id: "3501", name: "Kab. Pacitan" },
      { id: "3505", name: "Kab. Blitar" },
      { id: "3515", name: "Kab. Sidoarjo" },
      { id: "3516", name: "Kab. Mojokerto" },
      { id: "3571", name: "Kota Kediri" },
      { id: "3573", name: "Kota Malang" },
      { id: "3576", name: "Kota Madiun" },
      { id: "3578", name: "Kota Surabaya" },
    ]
  },
  {
    id: "36",
    name: "Banten",
    cities: [
      { id: "3601", name: "Kab. Pandeglang" },
      { id: "3671", name: "Kota Tangerang" },
      { id: "3672", name: "Kota Cilegon" },
      { id: "3674", name: "Kota Tangerang Selatan" },
    ]
  },
  {
    id: "51",
    name: "Bali",
    cities: [
      { id: "5101", name: "Kab. Jembrana" },
      { id: "5102", name: "Kab. Tabanan" },
      { id: "5103", name: "Kab. Badung" },
      { id: "5104", name: "Kab. Gianyar" },
      { id: "5171", name: "Kota Denpasar" },
    ]
  },
  {
    id: "52",
    name: "Nusa Tenggara Barat",
    cities: [
      { id: "5201", name: "Kab. Lombok Barat" },
      { id: "5271", name: "Kota Mataram" },
      { id: "5272", name: "Kota Bima" },
    ]
  },
  {
    id: "61",
    name: "Kalimantan Barat",
    cities: [
      { id: "6101", name: "Kab. Sambas" },
      { id: "6171", name: "Kota Pontianak" },
      { id: "6172", name: "Kota Singkawang" },
    ]
  },
  {
    id: "62",
    name: "Kalimantan Tengah",
    cities: [
      { id: "6201", name: "Kab. Kotawaringin Barat" },
      { id: "6271", name: "Kota Palangka Raya" },
    ]
  },
  {
    id: "63",
    name: "Kalimantan Selatan",
    cities: [
      { id: "6301", name: "Kab. Tanah Laut" },
      { id: "6371", name: "Kota Banjarmasin" },
      { id: "6372", name: "Kota Banjarbaru" },
    ]
  },
  {
    id: "64",
    name: "Kalimantan Timur",
    cities: [
      { id: "6401", name: "Kab. Paser" },
      { id: "6402", name: "Kab. Kutai Barat" },
      { id: "6403", name: "Kab. Kutai Kartanegara" },
      { id: "6471", name: "Kota Balikpapan" },
      { id: "6472", name: "Kota Samarinda" },
      { id: "6474", name: "Kota Bontang" },
    ]
  },
  {
    id: "73",
    name: "Sulawesi Selatan",
    cities: [
      { id: "7301", name: "Kab. Selayar" },
      { id: "7302", name: "Kab. Bulukumba" },
      { id: "7371", name: "Kota Makassar" },
      { id: "7372", name: "Kota Parepare" },
      { id: "7373", name: "Kota Palopo" },
    ]
  },
  {
    id: "74",
    name: "Sulawesi Tenggara",
    cities: [
      { id: "7401", name: "Kab. Buton" },
      { id: "7471", name: "Kota Kendari" },
      { id: "7472", name: "Kota Baubau" },
    ]
  },
  {
    id: "75",
    name: "Gorontalo",
    cities: [
      { id: "7501", name: "Kab. Boalemo" },
      { id: "7571", name: "Kota Gorontalo" },
    ]
  },
  {
    id: "76",
    name: "Sulawesi Barat",
    cities: [
      { id: "7601", name: "Kab. Polewali Mandar" },
      { id: "7602", name: "Kab. Mamuju" },
    ]
  },
  {
    id: "94",
    name: "Papua",
    cities: [
      { id: "9401", name: "Kab. Merauke" },
      { id: "9471", name: "Kota Jayapura" },
    ]
  },
]

export function getProvinces(): Province[] {
  return regions
}

export function getCitiesByProvince(provinceId: string): City[] {
  return regions.find(p => p.id === provinceId)?.cities ?? []
}
