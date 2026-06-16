# Bike hero photos (local)

The seed wires each bike's `hero_image_url` to a file in this folder:

```
/bike-photos/<slug>.jpg
```

Drop a real photo in here with the matching filename and it shows up as that
bike's hero image (on the public bike page, the explore grid, and the owner's
bike detail page). If the file is absent, the gallery falls back to its "No
photo yet" placeholder, so missing files never break the layout.

- **Format:** `.jpg` (the seed expects this extension). Landscape, ideally
  ~1600px wide. Keep them reasonably sized.
- **Not committed:** image files here are git-ignored on purpose, so nothing is
  baked into the repository. Sourcing the photos is your call; they stay on your
  machine. (If your repo is private and you *want* them committed, remove the
  `client/public/bike-photos/*` rule from the root `.gitignore`.)

## Filenames (one per seed bike)

| Bike | File |
|------|------|
| Specialized Tarmac SL7 | `tarmac-sl7.jpg` |
| Specialized Diverge | `diverge.jpg` |
| Cannondale CAAD13 | `caad13.jpg` |
| Trek Fuel EX | `fuel-ex.jpg` |
| Trek FX 3 | `fx-3.jpg` |
| Cervélo Caledonia | `caledonia.jpg` |
| Specialized Roubaix | `roubaix.jpg` |
| Cannondale Bad Boy | `bad-boy.jpg` |
| Canyon Ultimate CF SL | `ultimate-cf-sl.jpg` |
| Santa Cruz Hightower | `hightower.jpg` |
| Trek Marlin | `marlin.jpg` |
| Specialized Sirrus | `sirrus.jpg` |
| Trek Domane | `domane.jpg` |
| Trek 520 | `trek-520.jpg` |
| Salsa Warbird | `warbird.jpg` |
| State Bicycle 6061 | `6061-track.jpg` |
| Specialized Allez | `allez.jpg` |
| Canyon Spectral | `spectral.jpg` |
| Specialized Stumpjumper | `stumpjumper.jpg` |
| Santa Cruz Chameleon | `chameleon.jpg` |
| Surly Long Haul Trucker | `long-haul-trucker.jpg` |
| Canyon Grizl | `grizl.jpg` |

The slug is the bike's name, lower-cased with non-alphanumeric runs replaced by
hyphens (see `heroImageUrl()` in `server/src/db/seed.ts`).
