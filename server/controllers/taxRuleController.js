import * as taxRuleModel from '../models/taxRuleModel.js';

export async function getAllTaxRules(req, res) {
  try {
    const rules = await taxRuleModel.getTaxRules(req.user._id);
    res.json(rules);
  } catch (error) {
    console.error('getAllTaxRules error:', error);
    res.status(500).json({ message: 'Failed to fetch tax rules' });
  }
}

export async function createTaxRule(req, res) {
  try {
    const { name, rate, type, applicableTo, categories, items, enabled } = req.body;

    if (!name || rate === undefined || rate === null) {
      return res.status(400).json({ message: 'Name and rate are required' });
    }

    if (rate < 0 || rate > 100) {
      return res.status(400).json({ message: 'Rate must be between 0 and 100' });
    }

    if (applicableTo === 'categories' && (!categories || categories.length === 0)) {
      return res.status(400).json({ message: 'Please select at least one category' });
    }

    if (applicableTo === 'items' && (!items || items.length === 0)) {
      return res.status(400).json({ message: 'Please select at least one item' });
    }

    const ruleData = {
      userId: req.user._id,
      name,
      rate,
      type: type || 'service',
      applicableTo: applicableTo || 'all',
      categories: categories || [],
      items: items || [],
      enabled: enabled !== false,
    };

    const rule = await taxRuleModel.addTaxRule(ruleData);
    res.status(201).json(rule);
  } catch (error) {
    console.error('createTaxRule error:', error);
    res.status(500).json({ message: 'Failed to create tax rule' });
  }
}

export async function updateTaxRule(req, res) {
  try {
    const { id } = req.params;
    const { name, rate, type, applicableTo, categories, items, enabled } = req.body;

    if (rate && (rate < 0 || rate > 100)) {
      return res.status(400).json({ message: 'Rate must be between 0 and 100' });
    }

    if (applicableTo === 'categories' && (!categories || categories.length === 0)) {
      return res.status(400).json({ message: 'Please select at least one category' });
    }

    if (applicableTo === 'items' && (!items || items.length === 0)) {
      return res.status(400).json({ message: 'Please select at least one item' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (rate !== undefined) updates.rate = rate;
    if (type !== undefined) updates.type = type;
    if (applicableTo !== undefined) updates.applicableTo = applicableTo;
    if (categories !== undefined) updates.categories = categories || [];
    if (items !== undefined) updates.items = items || [];
    if (enabled !== undefined) updates.enabled = enabled;

    const rule = await taxRuleModel.updateTaxRule(id, updates);
    if (!rule) return res.status(404).json({ message: 'Tax rule not found' });
    res.json(rule);
  } catch (error) {
    console.error('updateTaxRule error:', error);
    res.status(500).json({ message: 'Failed to update tax rule' });
  }
}

export async function deleteTaxRule(req, res) {
  try {
    const { id } = req.params;
    const rule = await taxRuleModel.deleteTaxRule(id);
    if (!rule) return res.status(404).json({ message: 'Tax rule not found' });
    res.json({ message: 'Tax rule deleted' });
  } catch (error) {
    console.error('deleteTaxRule error:', error);
    res.status(500).json({ message: 'Failed to delete tax rule' });
  }
}
