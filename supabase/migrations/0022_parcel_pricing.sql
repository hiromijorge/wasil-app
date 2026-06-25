-- Parcel pricing configuration and delivery details

-- Add configurable rate card to platform_config
ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS parcel_base_fare_sar numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS parcel_per_km_rate_sar numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS parcel_per_kg_rate_sar numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS parcel_volumetric_divisor numeric NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS minimum_parcel_fare_sar numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS parcel_bike_multiplier numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parcel_car_multiplier numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS parcel_van_multiplier numeric NOT NULL DEFAULT 2.5;

-- Add delivery details to parcel_deliveries
ALTER TABLE public.parcel_deliveries
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS vehicle_type text DEFAULT 'bike',
  ADD COLUMN IF NOT EXISTS length_cm numeric,
  ADD COLUMN IF NOT EXISTS width_cm numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS volumetric_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS fare_breakdown jsonb;

-- Backfill existing parcels with sensible defaults
UPDATE public.parcel_deliveries
SET vehicle_type = 'bike'
WHERE vehicle_type IS NULL;

UPDATE public.parcel_deliveries
SET fare_breakdown = jsonb_build_object(
  'baseFare', 15,
  'distanceCharge', 0,
  'weightCharge', COALESCE(weight_kg, 1) * 3,
  'vehicleMultiplier', 1,
  'total', fare_sar
)
WHERE fare_breakdown IS NULL;
