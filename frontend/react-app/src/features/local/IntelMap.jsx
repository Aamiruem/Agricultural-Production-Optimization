import "leaflet/dist/leaflet.css";

import L from "leaflet";

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  LayersControl,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";

import { RAMP } from "./mapLayers";
import { loadGeo } from "./services";

const INDIA_CENTER = [22.5, 80];

function colorFor(value, breaks, ramp) {
  if (value == null) return "#d9d9d9";
  const i = breaks.findIndex((b) => value < b);
  return ramp[i === -1 ? ramp.length - 1 : i];
}

function ClickHandler({ mode, onPick, onVertex }) {
  useMapEvents({
    click(e) {
      const p = [e.latlng.lat, e.latlng.lng];
      if (mode === "draw") onVertex(p);
      else onPick(p);
    },
  });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    if (target.bounds) map.flyToBounds(target.bounds, { padding: [20, 20], duration: 0.8 });
    else if (target.point) map.flyTo(target.point, target.zoom ?? 12, { duration: 0.8 });
  }, [map, target]);
  return null;
}

/**
 * India agricultural map: boundaries (state → district → tehsil), point picking,
 * field drawing, SoilGrids raster layers and state choropleths.
 * Props: point, polygon, mode ("point"|"draw"), onPick, onVertex, flyTarget,
 *        selectedState (slug), selectedDistrictLgd, onStateClick, onDistrictClick,
 *        choropleth { id, label, values{state:number|string}, breaks, ramp, unit, categorical, note },
 *        soilSample [lat, lon]
 */
export function IntelMap({
  point,
  polygon = [],
  mode = "point",
  onPick,
  onVertex,
  flyTarget,
  selectedState,
  selectedDistrictLgd,
  onStateClick,
  onDistrictClick,
  choropleth,
  soilSample,
}) {
  const [states, setStates] = useState(null);
  const [districts, setDistricts] = useState(null);
  const [subdistricts, setSubdistricts] = useState(null);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    loadGeo("india-states.json").then(setStates, (e) => setGeoError(e.message));
  }, []);
  useEffect(() => {
    if (!selectedState) return;
    let live = true;
    Promise.all([loadGeo(`districts/${selectedState}.json`), loadGeo(`subdistricts/${selectedState}.json`)]).then(
      ([d, s]) => {
        if (!live) return;
        setDistricts(d);
        setSubdistricts(s);
      },
      (e) => live && setGeoError(e.message),
    );
    return () => {
      live = false;
    };
  }, [selectedState]);

  const tehsils = useMemo(() => {
    if (!subdistricts || !selectedDistrictLgd) return null;
    return {
      ...subdistricts,
      features: subdistricts.features.filter((f) => f.properties.district_lgd === selectedDistrictLgd),
    };
  }, [subdistricts, selectedDistrictLgd]);

  const stateStyle = (f) => {
    const name = f.properties.name;
    const v = choropleth?.values?.[name];
    const fill = choropleth
      ? choropleth.categorical
        ? (choropleth.colors?.[v] ?? "#d9d9d9")
        : colorFor(v, choropleth.breaks, choropleth.ramp ?? RAMP)
      : "#14532d";
    const selected = f.properties.slug === selectedState;
    return {
      color: selected ? "#facc15" : "#14532d",
      weight: selected ? 2.5 : 1,
      fillColor: fill,
      fillOpacity: choropleth ? 0.65 : selected ? 0.04 : 0.06,
    };
  };

  return (
    <div className="intel-map-wrap">
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        minZoom={4}
        maxBounds={[
          [0, 55],
          [42, 110],
        ]}
        className="intel-map"
        scrollWheelZoom
        worldCopyJump={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street map (OpenStreetMap)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite (Esri World Imagery)">
            <TileLayer
              attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="Soil pH 0–5 cm (SoilGrids)">
            <WMSTileLayer
              url="https://maps.isric.org/mapserv?map=/map/phh2o.map"
              layers="phh2o_0-5cm_mean"
              format="image/png"
              transparent
              opacity={0.6}
              attribution="SoilGrids &copy; ISRIC (CC BY 4.0)"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Soil organic carbon (SoilGrids)">
            <WMSTileLayer
              url="https://maps.isric.org/mapserv?map=/map/soc.map"
              layers="soc_0-5cm_mean"
              format="image/png"
              transparent
              opacity={0.6}
              attribution="SoilGrids &copy; ISRIC (CC BY 4.0)"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Soil total nitrogen (SoilGrids)">
            <WMSTileLayer
              url="https://maps.isric.org/mapserv?map=/map/nitrogen.map"
              layers="nitrogen_0-5cm_mean"
              format="image/png"
              transparent
              opacity={0.6}
              attribution="SoilGrids &copy; ISRIC (CC BY 4.0)"
            />
          </LayersControl.Overlay>
          <LayersControl.Overlay name="Soil clay content (SoilGrids)">
            <WMSTileLayer
              url="https://maps.isric.org/mapserv?map=/map/clay.map"
              layers="clay_0-5cm_mean"
              format="image/png"
              transparent
              opacity={0.6}
              attribution="SoilGrids &copy; ISRIC (CC BY 4.0)"
            />
          </LayersControl.Overlay>
        </LayersControl>

        {states && (
          <GeoJSON
            key={`states-${choropleth?.id ?? "none"}-${choropleth?.version ?? 0}-${selectedState ?? ""}`}
            data={states}
            style={stateStyle}
            onEachFeature={(f, layer) => {
              const v = choropleth?.values?.[f.properties.name];
              layer.bindTooltip(
                choropleth
                  ? `${f.properties.name}: ${v ?? "no data"}${v != null && choropleth.unit ? ` ${choropleth.unit}` : ""}`
                  : f.properties.name,
                { sticky: true },
              );
              layer.on("click", (e) => {
                if (mode === "draw") return;
                L.DomEvent.stopPropagation(e); // the polygon handles it; skip the generic map click
                onStateClick?.(f, [e.latlng.lat, e.latlng.lng]);
              });
            }}
          />
        )}
        {districts && selectedState && (
          <GeoJSON
            key={`d-${selectedState}-${selectedDistrictLgd ?? ""}`}
            data={districts}
            style={(f) => ({
              color: f.properties.lgd === selectedDistrictLgd ? "#facc15" : "#166534",
              weight: f.properties.lgd === selectedDistrictLgd ? 2.5 : 0.8,
              fillOpacity: 0.02,
              dashArray: "3",
            })}
            onEachFeature={(f, layer) => {
              layer.bindTooltip(`${f.properties.name} district`, { sticky: true });
              layer.on("click", (e) => {
                if (mode === "draw") return;
                L.DomEvent.stopPropagation(e); // the polygon handles it; skip the generic map click
                onDistrictClick?.(f, [e.latlng.lat, e.latlng.lng]);
              });
            }}
          />
        )}
        {tehsils && (
          <GeoJSON
            key={`t-${selectedDistrictLgd}`}
            data={tehsils}
            style={{ color: "#a16207", weight: 0.8, fillOpacity: 0 }}
            onEachFeature={(f, layer) => layer.bindTooltip(`${f.properties.name} (sub-district)`, { sticky: true })}
            interactive={mode !== "draw"}
          />
        )}

        {polygon.length >= 2 &&
          (polygon.length >= 3 ? (
            <Polygon positions={polygon} pathOptions={{ color: "#facc15", weight: 3, fillOpacity: 0.25 }} />
          ) : (
            <Polyline positions={polygon} pathOptions={{ color: "#facc15", weight: 3 }} />
          ))}
        {mode === "draw" &&
          polygon.map((p, i) => (
            <CircleMarker key={i} center={p} radius={4} pathOptions={{ color: "#facc15", fillOpacity: 1 }} />
          ))}
        {point && (
          <CircleMarker
            center={point}
            radius={9}
            pathOptions={{ color: "#fff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Selected point {point[0].toFixed(5)}, {point[1].toFixed(5)}
            </Tooltip>
          </CircleMarker>
        )}
        {soilSample && point && (soilSample[0] !== point[0] || soilSample[1] !== point[1]) && (
          <CircleMarker
            center={soilSample}
            radius={7}
            pathOptions={{ color: "#78350f", weight: 2, fillColor: "#d97706", fillOpacity: 0.9 }}
          >
            <Tooltip>SoilGrids sample cell (your point is masked)</Tooltip>
          </CircleMarker>
        )}

        <ClickHandler mode={mode} onPick={onPick} onVertex={onVertex} />
        <FlyTo target={flyTarget} />
      </MapContainer>
      {geoError && <p className="form-error">Boundary data failed to load: {geoError}</p>}
      {choropleth && <Legend choropleth={choropleth} />}
    </div>
  );
}

function Legend({ choropleth }) {
  if (choropleth.categorical) {
    return (
      <div className="map-legend" aria-label={`${choropleth.label} legend`}>
        <b>{choropleth.label}</b>
        <ul>
          {Object.entries(choropleth.colors).map(([k, c]) => (
            <li key={k}>
              <i style={{ background: c }} /> {k}
            </li>
          ))}
        </ul>
        {choropleth.note && <small>{choropleth.note}</small>}
      </div>
    );
  }
  const ramp = choropleth.ramp ?? RAMP;
  const b = choropleth.breaks;
  return (
    <div className="map-legend" aria-label={`${choropleth.label} legend`}>
      <b>{choropleth.label}</b>
      <ul>
        {ramp.map((c, i) => (
          <li key={c}>
            <i style={{ background: c }} />
            {i === 0 ? `< ${b[0]}` : i === ramp.length - 1 ? `≥ ${b[b.length - 1]}` : `${b[i - 1]}–${b[i]}`}{" "}
            {choropleth.unit}
          </li>
        ))}
        <li>
          <i style={{ background: "#d9d9d9" }} /> no data
        </li>
      </ul>
      {choropleth.note && <small>{choropleth.note}</small>}
    </div>
  );
}
