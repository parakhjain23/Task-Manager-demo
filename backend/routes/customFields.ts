import express, { Request, Response } from 'express';
import { prisma } from '../config/database';
import { stringifyBigInt } from '../utils/bigint';

const router = express.Router();

// ===============================
// CUSTOM FIELD METADATA ROUTES
// ===============================

// Create a new custom field definition
router.post('/metadata', async (req: Request, res: Response) => {
  try {
    const {
      orgId,
      categoryId,
      name,
      keyName,
      dataType,
      enums,
      description,
      meta,
      createdBy,
    } = req.body;

    // Validation
    if (!orgId || !categoryId || !name || !keyName || !dataType) {
      return res.status(400).json({
        error: 'Missing required fields: orgId, categoryId, name, keyName, and dataType are required'
      });
    }

    // Validate dataType
    const validDataTypes = ['number', 'text', 'boolean', 'json'];
    if (!validDataTypes.includes(dataType)) {
      return res.status(400).json({
        error: `Invalid dataType. Must be one of: ${validDataTypes.join(', ')}`
      });
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: BigInt(categoryId.toString()) },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const customField = await prisma.customFieldMetaData.create({
      data: {
        orgId: BigInt(orgId.toString()),
        categoryId: BigInt(categoryId.toString()),
        name,
        keyName,
        dataType,
        enums,
        description,
        meta,
        createdBy: createdBy ? BigInt(createdBy.toString()) : null,
        updatedBy: createdBy ? BigInt(createdBy.toString()) : null,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(stringifyBigInt(customField));
  } catch (error: any) {
    console.error('Error creating custom field metadata:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Custom field with this org_id and key_name already exists'
      });
    }
    res.status(500).json({ error: 'Failed to create custom field metadata' });
  }
});

// Get all custom field definitions for an organization or category
router.get('/metadata', async (req: Request, res: Response) => {
  try {
    const { orgId, categoryId } = req.query as any;

    if (!orgId && !categoryId) {
      return res.status(400).json({
        error: 'Either orgId or categoryId is required'
      });
    }

    const where: any = {};
    if (orgId) where.orgId = BigInt(orgId.toString());
    if (categoryId) where.categoryId = BigInt(categoryId.toString());

    const customFields = await prisma.customFieldMetaData.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            values: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(stringifyBigInt(customFields));
  } catch (error) {
    console.error('Error fetching custom field metadata:', error);
    res.status(500).json({ error: 'Failed to fetch custom field metadata' });
  }
});

// Get a single custom field definition by ID
router.get('/metadata/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customField = await prisma.customFieldMetaData.findUnique({
      where: {
        id: BigInt(id as string),
      },
      include: {
        category: true,
        values: {
          take: 10,
          include: {
            workItem: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!customField) {
      return res.status(404).json({ error: 'Custom field metadata not found' });
    }

    res.json(stringifyBigInt(customField));
  } catch (error) {
    console.error('Error fetching custom field metadata:', error);
    res.status(500).json({ error: 'Failed to fetch custom field metadata' });
  }
});

// Update custom field definition
router.put('/metadata/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, enums, meta, updatedBy } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enums !== undefined) updateData.enums = enums;
    if (meta !== undefined) updateData.meta = meta;
    if (updatedBy) updateData.updatedBy = BigInt(updatedBy.toString());

    const customField = await prisma.customFieldMetaData.update({
      where: {
        id: BigInt(id as string),
      },
      data: updateData,
      include: {
        category: true,
      },
    });

    res.json(stringifyBigInt(customField));
  } catch (error: any) {
    console.error('Error updating custom field metadata:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Custom field metadata not found' });
    }
    res.status(500).json({ error: 'Failed to update custom field metadata' });
  }
});

// Delete custom field definition (and all its values)
router.delete('/metadata/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Delete all values first
    await prisma.customFieldValue.deleteMany({
      where: { customFieldMetaDataId: BigInt(id as string) },
    });

    // Delete metadata
    await prisma.customFieldMetaData.delete({
      where: {
        id: BigInt(id as string),
      },
    });

    res.json({ message: 'Custom field metadata and all values deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting custom field metadata:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Custom field metadata not found' });
    }
    res.status(500).json({ error: 'Failed to delete custom field metadata' });
  }
});

// ===============================
// CUSTOM FIELD VALUES ROUTES
// ===============================

// Create or update a custom field value for a work item
router.post('/values', async (req: Request, res: Response) => {
  try {
    const {
      workItemId,
      customFieldMetaDataId,
      value,
      calculatedBy,
    } = req.body;

    // Validation
    if (!workItemId || !customFieldMetaDataId || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: workItemId, customFieldMetaDataId, and value are required'
      });
    }

    // Get metadata to determine data type
    const metaData = await prisma.customFieldMetaData.findUnique({
      where: { id: BigInt(customFieldMetaDataId.toString()) },
    });

    if (!metaData) {
      return res.status(404).json({ error: 'Custom field metadata not found' });
    }

    // Prepare value data based on data type
    const valueData: any = {
      workItemId: BigInt(workItemId.toString()),
      customFieldMetaDataId: BigInt(customFieldMetaDataId.toString()),
      calculatedBy: calculatedBy || 'user',
    };

    switch (metaData.dataType) {
      case 'number':
        valueData.valueNumber = value;
        break;
      case 'text':
        valueData.valueText = value;
        break;
      case 'boolean':
        valueData.valueBoolean = value;
        break;
      case 'json':
        valueData.valueJson = value;
        break;
    }

    // Upsert (create or update)
    const customFieldValue = await prisma.customFieldValue.upsert({
      where: {
        workItemId_customFieldMetaDataId: {
          workItemId: BigInt(workItemId.toString()),
          customFieldMetaDataId: BigInt(customFieldMetaDataId.toString()),
        },
      },
      create: valueData,
      update: valueData,
      include: {
        customFieldMetaData: true,
        workItem: true,
      },
    });

    res.status(201).json(stringifyBigInt(customFieldValue));
  } catch (error) {
    console.error('Error creating/updating custom field value:', error);
    res.status(500).json({ error: 'Failed to create/update custom field value' });
  }
});

// Get all custom field values for a work item
router.get('/values/work-item/:workItemId', async (req: Request, res: Response) => {
  try {
    const { workItemId } = req.params;

    const values = await prisma.customFieldValue.findMany({
      where: {
        workItemId: BigInt(workItemId as string),
      },
      include: {
        customFieldMetaData: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(stringifyBigInt(values));
  } catch (error) {
    console.error('Error fetching custom field values:', error);
    res.status(500).json({ error: 'Failed to fetch custom field values' });
  }
});

// Delete a custom field value
router.delete('/values/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.customFieldValue.delete({
      where: {
        id: BigInt(id as string),
      },
    });

    res.json({ message: 'Custom field value deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting custom field value:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Custom field value not found' });
    }
    res.status(500).json({ error: 'Failed to delete custom field value' });
  }
});

export default router;
