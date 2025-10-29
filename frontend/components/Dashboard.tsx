{/* NEW: Compact Mobile Quick Search - Show when no analysis OR when loading */}
{(!analysis || isLoading) && (
  <div className="sm:hidden p-3 bg-background border-b">
    <h2 className="text-sm font-semibold mb-3 text-foreground">Ready to analyze</h2>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const cleanAsin = mobileAsin.trim().toUpperCase();
        console.log('Form submitted with:', { cleanAsin, mobileMaxReviews, mobileEnableAI, mobileCountry }); // DEBUG
        if (cleanAsin.length === 10) {
          handleAnalyze(cleanAsin, mobileMaxReviews, mobileEnableAI, mobileCountry);
        } else {
          console.log('Invalid ASIN length:', cleanAsin.length); // DEBUG
        }
      }}
      className="space-y-2"
    >
      {/* ASIN input + Country selector in same row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            inputMode="text"
            placeholder="Enter ASIN (e.g., B0CHX3TYK1)"
            value={mobileAsin}
            onChange={(e) => {
              const newValue = e.target.value.toUpperCase();
              console.log('ASIN input changed:', newValue); // DEBUG
              setMobileAsin(newValue);
            }}
            maxLength={10}
            className="w-full border rounded-md px-3 h-10 font-mono text-sm bg-background"
            disabled={isLoading}
          />
        </div>
        <select
          value={mobileCountry}
          onChange={(e) => {
            console.log('Country changed:', e.target.value); // DEBUG
            setMobileCountry(e.target.value);
          }}
          className="border rounded-md px-2 h-10 text-xs bg-background min-w-[70px]"
          disabled={isLoading}
        >
          <option value="US">🇺🇸 US</option>
          <option value="UK">🇬🇧 UK</option>
          <option value="DE">🇩🇪 DE</option>
          <option value="FR">🇫🇷 FR</option>
          <option value="JP">🇯🇵 JP</option>
          <option value="CA">🇨🇦 CA</option>
          <option value="IN">🇮🇳 IN</option>
        </select>
      </div>
      
      <p className="text-[10px] text-muted-foreground">
        10-character Amazon product ID
      </p>

      {/* Compact Row: AI toggle + Max reviews */}
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/50">
          <input
            type="checkbox"
            checked={mobileEnableAI}
            onChange={(e) => {
              console.log('AI toggle changed:', e.target.checked); // DEBUG
              setMobileEnableAI(e.target.checked);
            }}
            className="h-3 w-3"
            disabled={isLoading}
          />
          <span className="font-medium">AI Analysis</span>
        </label>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Max</span>
          <input
            type="number"
            min={10}
            max={100}
            step={10}
            value={mobileMaxReviews}
            onChange={(e) => {
              console.log('Max reviews changed:', e.target.value); // DEBUG
              setMobileMaxReviews(Number(e.target.value));
            }}
            className="w-12 border rounded px-1 h-6 text-xs bg-background"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Analyze button */}
      <button
        type="submit"
        className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={isLoading || mobileAsin.length !== 10}
      >
        {isLoading ? 'Analyzing…' : 'Analyze Reviews'}
      </button>
      
      {/* DEBUG: Show current state */}
      <div className="text-[10px] text-muted-foreground">
        ASIN: {mobileAsin} ({mobileAsin.length}/10) | Country: {mobileCountry} | AI: {mobileEnableAI ? 'ON' : 'OFF'} | Max: {mobileMaxReviews}
      </div>
    </form>
  </div>
)}
