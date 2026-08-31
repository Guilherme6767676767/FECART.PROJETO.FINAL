import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { OcorrenciaBO, AOIZone } from '../types/sentinel';
import { SP_AOI_ZONES } from '../services/api';
import { Layers, Eye, EyeOff, MapPin, ZoomIn, ZoomOut, Crosshair } from 'lucide-react';

interface Props {
  ocorrencias: OcorrenciaBO[];
  selectedLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  highlightedId?: string | null;
}

export const InteractiveMap: React.FC<Props> = ({
  ocorrencias,
  selectedLocation,
  onMapClick,
  highlightedId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    aoiLayerGroup: L.LayerGroup;
    boLayerGroup: L.LayerGroup;
    simLayerGroup: L.LayerGroup;
    selectionLayerGroup: L.LayerGroup;
  } | null>(null);

  const [showAOIs, setShowAOIs] = useState(true);
  const [showBOs, setShowBOs] = useState(true);
  const [showSims, setShowSims] = useState(true);

  // Inicializar o mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Se já existir instância, não reinicializa
    if (mapInstanceRef.current) return;

    // Centro geográfico de São Paulo (Praça da Sé)
    const map = L.map(mapContainerRef.current, {
      center: [-23.555, -46.650],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Tiles CartoDB
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Grupos de camadas
    const aoiLayerGroup = L.layerGroup().addTo(map);
    const boLayerGroup = L.layerGroup().addTo(map);
    const simLayerGroup = L.layerGroup().addTo(map);
    const selectionLayerGroup = L.layerGroup().addTo(map);

    layersRef.current = {
      aoiLayerGroup,
      boLayerGroup,
      simLayerGroup,
      selectionLayerGroup,
    };

    // Evento de clique para capturar coordenadas
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onMapClick) {
        onMapClick(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onMapClick]);

  // Atualizar polígonos das Zonas AOI
  useEffect(() => {
    if (!layersRef.current) return;
    const { aoiLayerGroup } = layersRef.current;
    aoiLayerGroup.clearLayers();

    if (!showAOIs) return;

    SP_AOI_ZONES.forEach((zone: AOIZone) => {
      const polygon = L.polygon(zone.bounds, {
        color: zone.color,
        fillColor: zone.fillColor,
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '4, 6',
      });

      polygon.bindPopup(`
        <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
          <div style="font-size: 11px; font-weight: 800; color: ${zone.color}; text-transform: uppercase;">
            ${zone.code} • RISCO ${zone.riskLevel} (${zone.riskScore}/100)
          </div>
          <h4 style="margin: 4px 0; font-size: 14px; font-weight: 700;">${zone.name}</h4>
          <p style="margin: 4px 0 8px 0; font-size: 12px; color: #475569;">${zone.description}</p>
          <div style="display: flex; gap: 8px; font-size: 11px; font-weight: 600; color: #1e293b;">
            <span>📸 ${zone.activeCameras} Câmeras</span>
            <span>📡 ${zone.activeSensors} Sensores IoT</span>
          </div>
        </div>
      `);

      polygon.addTo(aoiLayerGroup);
    });
  }, [showAOIs]);

  // Atualizar marcadores de Ocorrências e Simulações
  useEffect(() => {
    if (!layersRef.current) return;
    const { boLayerGroup, simLayerGroup } = layersRef.current;
    boLayerGroup.clearLayers();
    simLayerGroup.clearLayers();

    ocorrencias.forEach((bo) => {
      const isSim = bo.id.startsWith('SIM-');
      if (isSim && !showSims) return;
      if (!isSim && !showBOs) return;

      const isCritical = bo.gravidade === 'CRITICA';
      const isHigh = bo.gravidade === 'ALTA';
      const isHighlighted = highlightedId === bo.id;

      const markerColor = isSim ? '#06b6d4' : (isCritical ? '#ef4444' : isHigh ? '#f59e0b' : '#3b82f6');

      // Marcador HTML customizado
      const iconHtml = `
        <div class="custom-map-marker ${isSim ? 'sim-marker-pulse' : ''} ${isHighlighted ? 'highlighted-pulse' : ''}" style="background-color: ${markerColor};">
          <div class="marker-core"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'leaflet-div-custom-marker',
        html: iconHtml,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([bo.latitude, bo.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; color: #0f172a; min-width: 200px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; font-family: monospace; color: ${markerColor};">
              ${bo.numero_bo}
            </span>
            <span style="font-size: 9px; font-weight: 700; background: ${markerColor}22; color: ${markerColor}; padding: 2px 6px; border-radius: 4px;">
              ${bo.gravidade}
            </span>
          </div>
          <h4 style="margin: 2px 0 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${bo.tipo_crime}</h4>
          <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">
            📍 <strong>${bo.bairro}</strong> — ${bo.logradouro}
          </div>
          <div style="font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            Status: <strong>${bo.status}</strong>
          </div>
        </div>
      `);

      if (isSim) {
        marker.addTo(simLayerGroup);
      } else {
        marker.addTo(boLayerGroup);
      }
    });
  }, [ocorrencias, showBOs, showSims, highlightedId]);

  // Atualizar marcador de seleção do usuário (onde ele clicou)
  useEffect(() => {
    if (!layersRef.current) return;
    const { selectionLayerGroup } = layersRef.current;
    selectionLayerGroup.clearLayers();

    if (selectedLocation) {
      const pinIcon = L.divIcon({
        className: 'leaflet-selection-pin',
        html: `
          <div class="selection-radar-pulse">
            <div class="pin-dot"></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const pinMarker = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: pinIcon });
      pinMarker.bindTooltip(`📍 Ponto de Simulação Selecionado<br/><small>${selectedLocation.lat}, ${selectedLocation.lng}</small>`, {
        permanent: false,
        direction: 'top',
        className: 'custom-leaflet-tooltip'
      });
      pinMarker.addTo(selectionLayerGroup);

      // Centralizar suavemente
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([selectedLocation.lat, selectedLocation.lng]);
      }
    }
  }, [selectedLocation]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-23.555, -46.650], 12);
    }
  };

  return (
    <div className="interactive-map-wrapper">
      {/* Controles de Camadas Flutuantes */}
      <div className="map-floating-controls">
        <div className="map-layer-toggles">
          <button
            className={`map-ctrl-btn ${showAOIs ? 'active' : ''}`}
            onClick={() => setShowAOIs(!showAOIs)}
            title="Alternar Zonas AOI"
          >
            <Layers size={14} />
            <span>Zonas AOI ({SP_AOI_ZONES.length})</span>
            {showAOIs ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            className={`map-ctrl-btn ${showBOs ? 'active' : ''}`}
            onClick={() => setShowBOs(!showBOs)}
            title="Alternar Ocorrências SSP-SP"
          >
            <MapPin size={14} />
            <span>Base SSP-SP</span>
            {showBOs ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            className={`map-ctrl-btn ${showSims ? 'active' : ''}`}
            onClick={() => setShowSims(!showSims)}
            title="Alternar Simulações Ativas"
          >
            <Crosshair size={14} />
            <span>Simulações IA</span>
            {showSims ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>

        <div className="map-zoom-toggles">
          <button className="map-zoom-btn" onClick={() => handleZoom(1)} title="Aproximar">
            <ZoomIn size={14} />
          </button>
          <button className="map-zoom-btn" onClick={() => handleZoom(-1)} title="Afastar">
            <ZoomOut size={14} />
          </button>
          <button className="map-zoom-btn" onClick={handleResetView} title="Recentralizar São Paulo">
            <Crosshair size={14} />
          </button>
        </div>
      </div>

      {/* Dica de interação */}
      <div className="map-click-hint">
        <span>💡 <strong>Dica:</strong> Clique em qualquer ponto do mapa de São Paulo para definir as coordenadas da simulação.</span>
      </div>

      {/* Container do Mapa Leaflet */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />
    </div>
  );
};
