_: hue: sat: light:
let
  h = hue / 360.0;
  s = sat;
  l = light;

  hue2rgb =
    p: q: t:
    let
      t' =
        if t < 0 then
          t + 1
        else if t > 1 then
          t - 1
        else
          t;
    in
    if t' < 1.0/6.0 then
      p + (q - p) * 6.0 * t'
    else if t' < 1.0/2.0 then
      q
    else if t' < 2.0/3.0 then
      p + (q - p) * (2.0/3.0 - t') * 6.0
    else
      p;

  q = if l < 0.5 then l * (1 + s) else l + s - l * s;
  p = 2 * l - q;

  r = if s == 0 then l else hue2rgb p q (h + 1.0/3.0);
  g = if s == 0 then l else hue2rgb p q h;
  b = if s == 0 then l else hue2rgb p q (h - 1.0/3.0);
in
{
  r = builtins.floor (r * 255);
  g = builtins.floor (g * 255);
  b = builtins.floor (b * 255);
}
