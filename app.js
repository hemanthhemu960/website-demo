// app.js - client-side calculator (no backend)
// Replace your existing static/app.js with this file.

(() => {
  const displayEl = document.getElementById("display");
  const statusEl = document.getElementById("status");
  const buttons = document.querySelectorAll(".btn");
  let input = "";         // current typed number as string (what user types)
  let stored = null;      // stored operand as string (left operand)
  let operator = null;    // current operator: "+", "-", "*", "/", "%"

  // Format numbers to avoid floating point artifacts.
  // Keeps up to 12 significant digits and trims trailing zeros.
  function formatNumber(n) {
    if (!isFinite(n)) return String(n);
    // Use toPrecision to limit significant digits, then remove trailing zeros.
    // Choose 12 significant digits as a reasonable default for a calculator.
    let s = Number(n).toPrecision(12);
    // Remove scientific notation if possible
    if (s.indexOf("e") !== -1) {
      // fallback to toString with possible exponential - keep as-is
      s = Number(n).toString();
    }
    // Trim trailing zeros and possible trailing dot
    if (s.indexOf(".") !== -1) {
      s = s.replace(/(\.\d*?[1-9])0+$/,'$1'); // remove trailing zeros after decimal
      s = s.replace(/\.0+$/,''); // remove .0
    }
    return s;
  }

  function updateDisplay(text) {
    displayEl.textContent = text;
  }

  function clearAll() {
    input = "";
    stored = null;
    operator = null;
    updateDisplay("0");
    statusEl.textContent = "";
  }

  function setInputChar(ch) {
    if (ch === "." && input.includes(".")) return;
    if (ch === "." && input === "") input = "0";
    if (input === "0" && ch !== ".") input = ch;
    else input += ch;
    updateDisplay(input);
  }

  function toggleSign() {
    if (!input) {
      // toggle stored if no current input
      if (stored !== null) {
        if (String(stored).startsWith("-")) stored = String(stored).slice(1);
        else stored = "-" + String(stored);
        updateDisplay(String(stored));
      } else {
        input = "-0";
        updateDisplay(input);
      }
      return;
    }
    if (input.startsWith("-")) input = input.slice(1);
    else input = "-" + input;
    updateDisplay(input);
  }

  // Local compute function (safe, no eval)
  function computeLocal(aStr, bStr, op) {
    const a = parseFloat(aStr);
    const b = parseFloat(bStr);
    if (isNaN(a) || isNaN(b)) return { ok: false, error: "Invalid number" };

    try {
      let res;
      switch (op) {
        case "+":
          res = a + b;
          break;
        case "-":
          res = a - b;
          break;
        case "*":
          res = a * b;
          break;
        case "/":
          if (b === 0) return { ok: false, error: "Division by zero" };
          res = a / b;
          break;
        case "%":
          if (b === 0) return { ok: false, error: "Division by zero" };
          res = a % b;
          break;
        default:
          return { ok: false, error: "Unsupported operator" };
      }
      // Format result to avoid tiny floating artifacts
      return { ok: true, result: formatNumber(res) };
    } catch (err) {
      return { ok: false, error: "Calculation error" };
    }
  }

  function pressOperator(op) {
    // If there's an input and no stored value, move input to stored
    if (input && stored === null) {
      stored = input;
      input = "";
      operator = op;
      updateDisplay(stored);
      statusEl.textContent = `${stored} ${operator}`;
      return;
    }

    // If there is stored and input, compute stored (op) input first
    if (stored !== null && input) {
      const r = computeLocal(stored, input, operator || op);
      if (!r.ok) {
        statusEl.textContent = r.error;
        updateDisplay("Error");
        // reset on error
        stored = null;
        input = "";
        operator = null;
        return;
      }
      stored = r.result;
      input = "";
      operator = op;
      updateDisplay(stored);
      statusEl.textContent = `${stored} ${operator}`;
      return;
    }

    // If stored exists but no input (user presses operator twice), just replace operator
    if (stored !== null && !input) {
      operator = op;
      statusEl.textContent = `${stored} ${operator}`;
      return;
    }

    // If nothing entered yet and user presses operator, ignore
  }

  function pressPercent() {
    // If input exists, convert it to percent
    if (input) {
      let val = parseFloat(input);
      if (isNaN(val)) { statusEl.textContent = "Invalid number"; return; }
      val = val / 100;
      input = formatNumber(val);
      updateDisplay(input);
    } else if (stored !== null && !input) {
      // Convert stored to percent if no current input
      let val = parseFloat(stored);
      if (isNaN(val)) { statusEl.textContent = "Invalid number"; return; }
      val = val / 100;
      stored = formatNumber(val);
      updateDisplay(stored);
      statusEl.textContent = "";
    }
  }

  function pressEquals() {
    // If no operator, just show current input or stored
    if (!operator) {
      if (input) updateDisplay(input);
      else if (stored) updateDisplay(stored);
      return;
    }
    const a = stored === null ? "0" : stored;
    const b = input === "" ? (stored === null ? "0" : stored) : input; // if user pressed = without second operand, use stored as b (like calculators do)
    const r = computeLocal(a, b, operator);
    if (!r.ok) {
      statusEl.textContent = r.error;
      updateDisplay("Error");
      stored = null;
      input = "";
      operator = null;
      return;
    }
    // Show result and make it the new stored value (so user can continue)
    updateDisplay(r.result);
    statusEl.textContent = `${a} ${operator} ${b} =`;
    stored = r.result;
    input = "";
    operator = null;
  }

  // Attach button listeners
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      const op = btn.dataset.op;
      const txt = btn.textContent.trim();

      if (action === "clear") {
        clearAll();
        return;
      }
      if (action === "sign") {
        toggleSign();
        return;
      }
      if (action === "percent") {
        pressPercent();
        return;
      }
      if (btn.classList.contains("num")) {
        setInputChar(txt);
        return;
      }
      if (op) {
        pressOperator(op);
        return;
      }
      if (btn.id === "equals") {
        pressEquals();
        return;
      }
    });
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    // Allow: digits and dot
    if ((e.key >= "0" && e.key <= "9") || e.key === ".") {
      setInputChar(e.key);
      e.preventDefault();
      return;
    }
    if (["+", "-", "*", "/", "%"].includes(e.key)) {
      pressOperator(e.key);
      e.preventDefault();
      return;
    }
    if (e.key === "Enter" || e.key === "=") {
      pressEquals();
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace") {
      // Remove last char from input
      if (input) {
        input = input.slice(0, -1);
        updateDisplay(input || "0");
      } else {
        // if no input, clear operator or stored
        operator = null;
        statusEl.textContent = "";
      }
      e.preventDefault();
      return;
    }
    if (e.key.toLowerCase() === "c") {
      clearAll();
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      clearAll();
      e.preventDefault();
      return;
    }
  });

  // Initialize
  clearAll();
})();
