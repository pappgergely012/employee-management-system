CREATE TABLE IF NOT EXISTS org_chart_nodes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  employee_id INTEGER REFERENCES employees(id),
  parent_id INTEGER REFERENCES org_chart_nodes(id),
  level INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);