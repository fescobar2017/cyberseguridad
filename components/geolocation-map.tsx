"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Globe, Clock, Flag, Loader2, Server, Building } from "lucide-react"
import { fetchGeolocation, type GeoData } from "@/lib/security-api"

interface GeolocationMapProps {
  target: string | null
  isScanning: boolean
  onGeoDataLoaded?: (geoData: GeoData) => void
}

export function GeolocationMap({ target, isScanning, onGeoDataLoaded }: GeolocationMapProps) {
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (target && !isScanning) {
      setLoading(true)
      setError(null)

      fetchGeolocation(target)
        .then((data) => {
          setGeoData(data)
          if (data && onGeoDataLoaded) {
            onGeoDataLoaded(data)
          }
        })
        .catch((err) => {
          console.log("[v0] Geo error:", err)
          setError("No se pudo obtener la ubicación")
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [target, isScanning, onGeoDataLoaded])

  if (!target) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <MapPin className="w-5 h-5 text-neon-green" />
            Geolocalización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Esperando escaneo...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading || isScanning) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <MapPin className="w-5 h-5 text-neon-green" />
            Geolocalización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-12 h-12 mb-3 animate-spin text-neon-green" />
            <p className="text-sm">Obteniendo ubicación...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !geoData) {
    return (
      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <MapPin className="w-5 h-5 text-alert-red" />
            Geolocalización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm text-alert-red">{error || "Sin datos disponibles"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${geoData.longitude - 0.1},${geoData.latitude - 0.05},${geoData.longitude + 0.1},${geoData.latitude + 0.05}&layer=mapnik&marker=${geoData.latitude},${geoData.longitude}`

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground text-base">
          <MapPin className="w-5 h-5 text-neon-green" />
          Geolocalización
          <span className="ml-auto text-xs font-normal text-muted-foreground font-mono">{geoData.ip}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Real Map */}
        <div className="relative rounded-lg overflow-hidden border border-border bg-secondary h-40">
          <iframe src={mapUrl} className="w-full h-full border-0" title="Mapa de ubicación" />
          <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
            {geoData.latitude.toFixed(4)}, {geoData.longitude.toFixed(4)}
          </div>
        </div>

        {/* Location Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="w-3 h-3" />
              <span>País</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{geoData.country}</p>
          </div>

          <div className="space-y-1 p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>Ciudad</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">
              {geoData.city}, {geoData.region}
            </p>
          </div>

          <div className="space-y-1 p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Zona Horaria</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{geoData.timezone}</p>
          </div>

          <div className="space-y-1 p-2 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Server className="w-3 h-3" />
              <span>ISP</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{geoData.isp}</p>
          </div>
        </div>

        {/* ASN Info */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building className="w-3 h-3" />
            <span>Organización</span>
          </div>
          <span className="font-mono text-foreground truncate max-w-[60%]">{geoData.org}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">ASN</span>
          <span className="font-mono text-neon-green">{geoData.asn}</span>
        </div>
      </CardContent>
    </Card>
  )
}
