# Dodge Night Rides accepted user save

Promoted `/Users/thepartyrocker/Desktop/recipe-files/night-rides.nflyer` verbatim to
`public/generated-flyers/dodge-night-rides.nflyer`. Both saved format sessions are
now the existing gallery entry source; all other 24 gallery entries are unchanged.
Archive, SHA-256 and original location are recorded in
`lib/template-data/dodge-night-rides-saved-source.json`. The dedicated builder
now refuses to overwrite the accepted save. The portable loader cache revision
uses the source hash prefix, `03d8ba36f7cf`.

Actual editor Square and Story previews were refreshed and visually inspected;
preview run passed without page errors. Recipe preview registry and gallery use
`public/generated-flyers/dodge-night-rides-{square,story}-preview.png`.

Validation: four accepted-save/gallery tests passed, verifying exact archive bytes,
source hash, every saved gallery field after image externalization and asset-list
normalization, full recipe coverage and available image assets. Focused lint passed.
This promotion did not rebuild CSS or rerun all editing/export controls. No commit
or deployment.
