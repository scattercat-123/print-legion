import { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { useTheme } from "next-themes";

const geoUrl = "/geo_assets/features.json";

interface CountryStats {
  countryCode: string;
  countryName: string;
  printerCount: number;
  userCount: number;
}

function MapComponent({
  points,
  className,
  activeGraph,
}: {
  points: CountryStats[];
  className?: string;
  activeGraph: "printers" | "users" | "density";
}) {
  const [hoveredCountry, setHoveredCountry] = useState<CountryStats | null>(
    null
  );
  const { resolvedTheme } = useTheme();

  // Create color scale based on printer density (printers/users)
  const maxDensity = Math.max(
    ...points.map((p) =>
      activeGraph === "printers"
        ? p.printerCount
        : activeGraph === "users"
        ? p.userCount
        : p.userCount > 0
        ? p.printerCount / p.userCount
        : 0
    )
  );

  const colorScale = scaleLinear<string>()
    .domain([0, maxDensity])
    .range(
      resolvedTheme === "dark" ? ["#27272a", "#e4e4e7"] : ["#e4e4e7", "#27272a"]
    ); // from slate-200 to primary

  return (
    <div className={`relative ${className}`}>
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          //   scale: 147,
          scale: 170,
        }}
        height={450}
      >
        <Sphere
          id="sphere"
          fill="transparent"
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={0.3}
        />
        <Graticule
          id="graticule"
          fill="transparent"
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={0.3}
        />
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryData = points.find((p) => p.countryCode === geo.id);
              const point = countryData
                ? activeGraph === "printers"
                  ? countryData.printerCount
                  : activeGraph === "users"
                  ? countryData.userCount
                  : countryData.printerCount / countryData.userCount
                : 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  className="transition-colors duration-75"
                  geography={geo}
                  onMouseEnter={() => {
                    if (countryData) setHoveredCountry(countryData);
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                  fill={
                    countryData
                      ? colorScale(point)
                      : resolvedTheme === "dark"
                      ? "#18181b"
                      : "#f4f4f5"
                  }
                  stroke={resolvedTheme === "dark" ? "#27272a" : "#d4d4d4"}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: countryData
                        ? "hsl(var(--primary))"
                        : resolvedTheme === "dark"
                        ? "#27272a"
                        : "#d4d4d4",
                      outline: "none",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Fixed tooltip */}
      <div
        className={`absolute bottom-2 left-2 p-3 rounded-lg bg-background/80 backdrop-blur border shadow-lg transition-opacity ${
          hoveredCountry ? "opacity-100" : "opacity-0"
        }`}
      >
        {hoveredCountry && (
          <div className="text-sm">
            <p className="font-semibold">{hoveredCountry.countryName}</p>
            <p>Printers: {hoveredCountry.printerCount}</p>
            <p>Users: {hoveredCountry.userCount}</p>
            <p className="text-xs text-muted-foreground">
              {(
                (hoveredCountry.printerCount / hoveredCountry.userCount) *
                100
              ).toFixed(1)}
              % printer density
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MapComponent);
