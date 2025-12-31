{ lib ? (import <nixpkgs> {}).lib }:

# Convert OKLCH to sRGB
# l: lightness (0-1), c: chroma (0-0.4), h: hue (0-360)
# Returns: { r, g, b } where each is 0-255

lightness: chroma: hue:
let
  # Manual trigonometric functions using Taylor series
  # Simple approximations for the range 0-2π
  cos = x: let
    # Normalize to 0-2π range
    twoPi = 2.0 * 3.14159265359;
    normalized = if x > twoPi then lib.mod x twoPi else if x < 0.0 then (x + twoPi) else x;
    # Taylor series: cos(x) = 1 - x^2/2! + x^4/4! - x^6/6! + ...
    x2 = normalized * normalized;
    result = 1.0 - (x2 / 2.0) + (x2 * x2 / 24.0) - (x2 * x2 * x2 / 720.0);
  in result;
  
  # Sine approximation  
  sin = x: let
    # Normalize to 0-2π range
    twoPi = 2.0 * 3.14159265359;
    normalized = if x > twoPi then lib.mod x twoPi else if x < 0.0 then (x + twoPi) else x;
    # Taylor series: sin(x) = x - x^3/3! + x^5/5! - x^7/7! + ...
    x2 = normalized * normalized;
    x3 = x2 * normalized;
    result = normalized - (x3 / 6.0) + (x3 * x2 / 120.0) - (x3 * x2 * x2 / 5040.0);
  in result;
  
  # OKLCH to OKLab
  hRad = hue * 3.14159265359 / 180.0;
  a = chroma * cos hRad;
  b = chroma * sin hRad;
  L = lightness;

  # OKLab to Linear sRGB via LMS
  # L' = L + 0.3963377774 * a + 0.2158037573 * b
  # M' = L - 0.1055613458 * a - 0.0638541728 * b
  # S' = L - 0.0894841775 * a - 1.2914855480 * b
  l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  # Cube the values (inverse of cube root in forward transform)
  l = l_ * l_ * l_;
  m = m_ * m_ * m_;
  s = s_ * s_ * s_;

  # LMS to Linear sRGB
  # [R]   [ 4.0767416621 -3.3077115913  0.2309699292] [l]
  # [G] = [-1.2684380046  2.6097574011 -0.3413193965] [m]
  # [B]   [-0.0041960863 -0.7034186147  1.7076147010] [s]
  rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  # Linear sRGB to sRGB (gamma correction)
  # if c <= 0.0031308: 12.92 * c
  # else: 1.055 * c^(1/2.4) - 0.055
  # Manual power function: x^(1/2.4) = x^0.4167
  pow = base: exp: let
    # Simple approximation for x^0.4167 using exponential approximation
    # ln(x^y) = y * ln(x), so x^y = exp(y * ln(x))
    # For small exponents, we can use polynomial approximation
    result = if exp == 0.4167 then
      # c^(1/2.4) approximation using Taylor series around c=0.5
      let c_adj = base / 0.5;
      in 0.5 * (1.0 + (exp - 0.5) * 2.0 + ((exp - 0.5) * 2.0) * ((exp - 0.5) * 2.0) * 0.5)
    else if exp == 2.0 then base * base
    else if exp == 3.0 then base * base * base
    else if exp == 0.5 then lib.sqrt base
    else base;  # fallback
  in result;
  
  gamma = c:
    if c <= 0.0031308
    then 12.92 * c
    else 1.055 * (pow c 0.4167) - 0.055;

  rGamma = gamma rLin;
  gGamma = gamma gLin;
  bGamma = gamma bLin;

  # Clamp and convert to 0-255
  clamp = v: if v < 0.0 then 0.0 else if v > 1.0 then 1.0 else v;
  toInt = v: builtins.floor ((clamp v) * 255 + 0.5);
in
{
  r = toInt rGamma;
  g = toInt gGamma;
  b = toInt bGamma;
}