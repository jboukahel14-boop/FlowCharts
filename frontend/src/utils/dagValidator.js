export class DAGValidator {
  static validate(nodes, edges) {
    const errors = [];
    const warnings = [];

    if (!nodes.length) {
      errors.push({ type: 'error', message: 'Workflow must contain at least one node' });
      return { valid: false, errors, warnings };
    }

    const nodeIds = new Set(nodes.map((n) => n.id));
    const nodeTypes = nodes.reduce((acc, n) => {
      acc[n.id] = n.type || n.data?.type;
      return acc;
    }, {});

    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push({ type: 'error', message: `Edge references non-existent source node: ${edge.source}` });
      }
      if (!nodeIds.has(edge.target)) {
        errors.push({ type: 'error', message: `Edge references non-existent target node: ${edge.target}` });
      }
    }

    const adjacency = new Map();
    const inDegree = new Map();

    for (const id of nodeIds) {
      adjacency.set(id, []);
      inDegree.set(id, 0);
    }

    for (const edge of edges) {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        adjacency.get(edge.source).push(edge.target);
        inDegree.set(edge.target, inDegree.get(edge.target) + 1);
      }
    }

    const queue = [];
    for (const [id, degree] of inDegree) {
      if (degree === 0) queue.push(id);
    }

    if (queue.length === 0) {
      errors.push({ type: 'error', message: 'Cycle detected: all nodes have incoming edges, forming a closed loop' });
    }

    if (queue.length > 1) {
      warnings.push({ type: 'warning', message: `Multiple entry points detected (${queue.length}). Consider adding a single trigger node.` });
    }

    const triggerNodes = nodes.filter((n) => (n.type || n.data?.type) === 'trigger');
    if (triggerNodes.length === 0) {
      warnings.push({ type: 'warning', message: 'No trigger node found. Workflow will not start automatically.' });
    }
    if (triggerNodes.length > 1) {
      warnings.push({ type: 'warning', message: `Multiple trigger nodes (${triggerNodes.length}). Only the first will execute.` });
    }

    let visitedCount = 0;
    const topoOrder = [];
    while (queue.length > 0) {
      const current = queue.shift();
      topoOrder.push(current);
      visitedCount++;
      for (const neighbor of adjacency.get(current)) {
        const newDegree = inDegree.get(neighbor) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (visitedCount !== nodes.length) {
      const visitedSet = new Set(topoOrder);
      const cycleNodes = nodes.filter((n) => !visitedSet.has(n.id));
      errors.push({
        type: 'error',
        message: `Cycle detected involving nodes: ${cycleNodes.map((n) => n.data?.label || n.id).join(', ')}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      topologicalOrder: errors.length === 0 ? topoOrder : null,
    };
  }

  static getExecutionPlan(nodes, edges) {
    const validateResult = this.validate(nodes, edges);
    if (!validateResult.valid) {
      throw new Error(`Cannot generate execution plan: ${validateResult.errors.map((e) => e.message).join('; ')}`);
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return validateResult.topologicalOrder.map((nodeId) => {
      const node = nodeMap.get(nodeId);
      const incoming = edges.filter((e) => e.target === nodeId).map((e) => ({
        sourceId: e.source,
        sourceLabel: nodeMap.get(e.source)?.data?.label || e.source,
      }));
      const outgoing = edges.filter((e) => e.source === nodeId).map((e) => ({
        targetId: e.target,
        targetLabel: nodeMap.get(e.target)?.data?.label || e.target,
      }));

      return {
        nodeId,
        label: node.data.label,
        type: node.type || node.data.type,
        config: node.data.config || {},
        order: validateResult.topologicalOrder.indexOf(nodeId),
        incoming,
        outgoing,
        depth: this._computeDepth(nodeId, edges, nodeMap),
      };
    });
  }

  static _computeDepth(nodeId, edges, nodeMap) {
    let depth = 0;
    let current = nodeId;
    const visited = new Set();
    while (current) {
      const incoming = edges.filter((e) => e.target === current);
      if (incoming.length === 0) break;
      if (visited.has(current)) break;
      visited.add(current);
      current = incoming[0].source;
      depth++;
    }
    return depth;
  }
}
