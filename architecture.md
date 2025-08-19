# Extraction Analytics Page Architecture

## Updated Component Structure

```mermaid
graph TD
    A[ExtractionsPage] --> B[Header]
    A --> C[Summary Cards Grid]
    A --> D[Charts Grid]
    A --> E[Efficiency Chart]
    
    C --> C1[Total Extractions Card]
    C --> C2[Completed Extractions Card]
    C --> C3[Avg Input Tokens Card]
    C --> C4[Avg Output Tokens Card]
    
    D --> D1[Combined Extractions Chart]
    D --> D2[Candlestick Token Trends Chart]
    
    E --> E1[Integer Efficiency Chart]
    E --> E2[Classic Legend]
    
    D1 --> D1A[Side-by-side Bars]
    D1 --> D1B[Project Colors]
    
    D2 --> D2A[Candlestick Visualization]
    D2 --> D2B[Input/Output Series]
    
    E1 --> E1A[Integers Instead of Floats]
    E1 --> E1B[Color-coded Series]
    
    E2 --> E2A[Input Tokens Legend]
    E2 --> E2B[Output Tokens Legend]
```

## Data Flow

```mermaid
graph LR
    A[Supabase Database] --> B[Data Fetching Layer]
    B --> C[Data Processing]
    C --> D[Chart Components]
    D --> E[Visualizations]
    
    C --> F[Summary Calculations]
    F --> G[Summary Cards]
```

## Key Updates

1. **Chart Styling**: Using project's hsl(var(--chart-N)) color variables
2. **Combined Extractions**: Side-by-side bars for total vs completed extractions
3. **Summary Cards**: Avg output tokens replacing total raw grants
4. **Token Trends**: Candlestick chart style for daily token usage
5. **Efficiency Metrics**: Integer values with classic legend
6. **Responsive Design**: All components adapt to screen sizes