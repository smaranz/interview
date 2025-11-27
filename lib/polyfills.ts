// Polyfill DOMMatrix for Node.js environment
// This is needed for cheerio and other libraries that expect browser APIs

if (typeof globalThis.DOMMatrix === 'undefined') {
  // Minimal DOMMatrix polyfill
  class DOMMatrixPolyfill {
    a: number = 1
    b: number = 0
    c: number = 0
    d: number = 1
    e: number = 0
    f: number = 0
    m11: number = 1
    m12: number = 0
    m13: number = 0
    m14: number = 0
    m21: number = 0
    m22: number = 1
    m23: number = 0
    m24: number = 0
    m31: number = 0
    m32: number = 0
    m33: number = 1
    m34: number = 0
    m41: number = 0
    m42: number = 0
    m43: number = 0
    m44: number = 1

    constructor(init?: string | number[]) {
      if (typeof init === 'string') {
        // Parse matrix string
        const values = init.match(/[\d.-]+/g)?.map(Number) || []
        this.setMatrix(values)
      } else if (Array.isArray(init)) {
        this.setMatrix(init)
      } else {
        // Identity matrix
        this.setMatrix([1, 0, 0, 1, 0, 0])
      }
    }

    private setMatrix(values: number[]) {
      if (values.length === 6) {
        // 2D matrix
        this.a = this.m11 = values[0] || 1
        this.b = this.m12 = values[1] || 0
        this.c = this.m21 = values[2] || 0
        this.d = this.m22 = values[3] || 1
        this.e = this.m41 = values[4] || 0
        this.f = this.m42 = values[5] || 0
        
        // 3D defaults
        this.m13 = this.m14 = this.m23 = this.m24 = 0
        this.m31 = this.m32 = this.m33 = 0
        this.m34 = 0
        this.m43 = 0
        this.m44 = 1
      } else if (values.length === 16) {
        // 4x4 matrix
        this.m11 = values[0] || 1
        this.m12 = values[1] || 0
        this.m13 = values[2] || 0
        this.m14 = values[3] || 0
        this.m21 = values[4] || 0
        this.m22 = values[5] || 1
        this.m23 = values[6] || 0
        this.m24 = values[7] || 0
        this.m31 = values[8] || 0
        this.m32 = values[9] || 0
        this.m33 = values[10] || 1
        this.m34 = values[11] || 0
        this.m41 = values[12] || 0
        this.m42 = values[13] || 0
        this.m43 = values[14] || 0
        this.m44 = values[15] || 1
        
        this.a = this.m11
        this.b = this.m12
        this.c = this.m21
        this.d = this.m22
        this.e = this.m41
        this.f = this.m42
      } else {
        // Identity matrix
        this.a = this.m11 = this.d = this.m22 = this.m44 = 1
        this.b = this.m12 = this.c = this.m21 = this.e = this.m41 = this.f = this.m42 = 0
        this.m13 = this.m14 = this.m23 = this.m24 = 0
        this.m31 = this.m32 = this.m33 = this.m34 = 0
        this.m43 = 0
      }
    }

    multiply(other: DOMMatrixPolyfill): DOMMatrixPolyfill {
      // Simple 2D matrix multiplication
      return new DOMMatrixPolyfill([
        this.a * other.a + this.c * other.b,
        this.b * other.a + this.d * other.b,
        this.a * other.c + this.c * other.d,
        this.b * other.c + this.d * other.d,
        this.a * other.e + this.c * other.f + this.e,
        this.b * other.e + this.d * other.f + this.f,
      ])
    }

    translate(x: number, y: number): DOMMatrixPolyfill {
      return this.multiply(new DOMMatrixPolyfill([1, 0, 0, 1, x, y]))
    }

    scale(x: number, y?: number): DOMMatrixPolyfill {
      return this.multiply(new DOMMatrixPolyfill([x, 0, 0, y ?? x, 0, 0]))
    }

    rotate(angle: number): DOMMatrixPolyfill {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return this.multiply(new DOMMatrixPolyfill([cos, sin, -sin, cos, 0, 0]))
    }
  }

  // @ts-expect-error - Adding polyfill to global
  globalThis.DOMMatrix = DOMMatrixPolyfill
}

// Export for use in modules
export {}

