# src/oklch2rgb.nix
# Perceptually accurate OKLCH to sRGB conversion for Nix
_: {
  l,
  c,
  h,
}: let
  pi = 3.14159265358979323846;

  # Float modulo: Nix builtins.mod only supports integers
  fmod = x: y: x - (builtins.floor (x / y)) * y;

  # Square Root via Newton-Raphson (15 iterations for deep precision)
  sqrt = x:
    if x <= 0.0
    then 0.0
    else let
      # Better initial guess: 1 for small numbers, x for large
      init =
        if x < 1.0
        then 1.0
        else x;
      iter = g: (g + x / g) / 2.0;
      g1 = iter init;
      g2 = iter g1;
      g3 = iter g2;
      g4 = iter g3;
      g5 = iter g4;
      g6 = iter g5;
      g7 = iter g6;
      g8 = iter g7;
      g9 = iter g8;
      g10 = iter g9;
      g11 = iter g10;
      g12 = iter g11;
      g13 = iter g12;
      g14 = iter g13;
      g15 = iter g14;
    in
      g15;

  # Cube Root via Newton-Raphson
  cbrt = x:
    if x == 0.0
    then 0.0
    else if x < 0.0
    then 0.0 - (cbrt (0.0 - x))
    else let
      init =
        if x < 1.0
        then 1.0
        else x;
      iter = g: (2.0 * g + x / (g * g)) / 3.0;
      g1 = iter init;
      g2 = iter g1;
      g3 = iter g2;
      g4 = iter g3;
      g5 = iter g4;
      g6 = iter g5;
      g7 = iter g6;
      g8 = iter g7;
      g9 = iter g8;
      g10 = iter g9;
      g11 = iter g10;
      g12 = iter g11;
      g13 = iter g12;
      g14 = iter g13;
      g15 = iter g14;
    in
      g15;

  # Sine via Bhaskara I approximation
  sinRaw = x: let
    x_ = fmod x (2.0 * pi);
    norm =
      if x_ < 0.0
      then x_ + (2.0 * pi)
      else x_;
  in
    if norm <= pi
    then (16.0 * norm * (pi - norm)) / (5.0 * pi * pi - 4.0 * norm * (pi - norm))
    else let
      n = norm - pi;
    in
      0.0 - ((16.0 * n * (pi - n)) / (5.0 * pi * pi - 4.0 * n * (pi - n)));

  cos = x: sinRaw (x + (pi / 2.0));
  sin = sinRaw;

  # sRGB Gamma Power: x^(1/2.4) = x^(5/12)
  # Roots-First prevents tiny numbers like (0.008)^5 from causing issues
  powGamma = x:
    if x <= 0.0
    then 0.0
    else let
      # x^(1/12)
      x1_12 = cbrt (sqrt (sqrt x));
      # (x^(1/12))^5
    in
      x1_12 * x1_12 * x1_12 * x1_12 * x1_12;

  # --- Transform Steps ---

  hRad = h * pi / 180.0;
  a_ = c * (cos hRad);
  b_ = c * (sin hRad);

  # OKLab -> LMS
  l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
  m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
  s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

  # Inverse cube root
  l_lin = l_ * l_ * l_;
  m_lin = m_ * m_ * m_;
  s_lin = s_ * s_ * s_;

  # LMS -> Linear sRGB
  r_lin = 4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
  g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
  b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

  # Linear sRGB -> sRGB
  gamma = v:
    if v <= 0.0031308
    then 12.92 * v
    else 1.055 * (powGamma v) - 0.055;

  clamp = v:
    if v < 0.0
    then 0.0
    else if v > 1.0
    then 1.0
    else v;

  r = toInt (clamp (gamma r_lin));
  g = toInt (clamp (gamma g_lin));
  b = toInt (clamp (gamma b_lin));

  toInt = v: builtins.floor (v * 255.0 + 0.5);
  toHex = n: let
    hexChars = "0123456789abcdef";
    # Stay in bounds
    v =
      if n < 0
      then 0
      else if n > 255
      then 255
      else n;
    hIdx = v / 16;
    lIdx = v - (hIdx * 16);
  in "${builtins.substring hIdx 1 hexChars}${builtins.substring lIdx 1 hexChars}";
in "#${toHex r}${toHex g}${toHex b}"
