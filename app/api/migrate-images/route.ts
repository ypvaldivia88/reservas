import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { uploadBase64ToBlob, deleteImageFromBlob } from '@/lib/blobStorage';

/**
 * Migration API to convert existing base64 images to Vercel Blob
 * 
 * GET /api/migrate-images - Migrate all images with base64Data to Vercel Blob
 * 
 * This endpoint will:
 * 1. Find all images that have base64Data but no blobUrl
 * 2. Upload each to Vercel Blob
 * 3. Update the database with the blobUrl
 * 4. Remove the base64Data field to save space
 */
export async function GET(request: NextRequest) {
  const results: any[] = [];
  let migrated = 0;
  let errors = 0;
  let skipped = 0;

  try {
    const db = await getDatabase();
    
    // Find all images that have base64Data but no blobUrl
    const imagesToMigrate = await db
      .collection('imagenes')
      .find({
        base64Data: { $exists: true },
        $or: [
          { blobUrl: { $exists: false } },
          { blobUrl: null },
          { blobUrl: '' }
        ]
      })
      .toArray();

    results.push(`Found ${imagesToMigrate.length} images to migrate`);

    if (imagesToMigrate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No images to migrate. All images are already using Vercel Blob.',
        results,
        stats: { migrated: 0, errors: 0, skipped: 0, total: 0 }
      });
    }

    // Migrate each image
    for (const imagen of imagesToMigrate) {
      try {
        results.push(`\nMigrating: ${imagen.nombre} (ID: ${imagen._id})`);

        // Check if base64Data is valid
        if (!imagen.base64Data || !imagen.mimeType) {
          results.push(`  ⚠️  Skipped - Missing base64Data or mimeType`);
          skipped++;
          continue;
        }

        // Upload to Vercel Blob
        const blob = await uploadBase64ToBlob(
          imagen.base64Data,
          imagen.nombre,
          imagen.mimeType
        );

        results.push(`  ✅ Uploaded to blob: ${blob.url}`);

        // Update database - set blobUrl and remove base64Data
        await db.collection('imagenes').updateOne(
          { _id: imagen._id },
          {
            $set: {
              blobUrl: blob.url,
              fechaActualizacion: new Date()
            },
            $unset: {
              base64Data: '' // Remove the base64Data field to save space
            }
          }
        );

        results.push(`  ✅ Database updated - base64Data removed`);
        migrated++;

      } catch (error: any) {
        results.push(`  ❌ Error: ${error.message}`);
        errors++;
      }
    }

    results.push(`\n📊 Migration Summary:`);
    results.push(`   Total found: ${imagesToMigrate.length}`);
    results.push(`   Migrated: ${migrated}`);
    results.push(`   Errors: ${errors}`);
    results.push(`   Skipped: ${skipped}`);

    return NextResponse.json({
      success: errors === 0,
      message: `Migration completed. ${migrated} images migrated successfully.`,
      results,
      stats: {
        migrated,
        errors,
        skipped,
        total: imagesToMigrate.length
      }
    });

  } catch (error: any) {
    results.push(`\n❌ Fatal error: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
      stats: { migrated, errors, skipped, total: 0 }
    }, { status: 500 });
  }
}

/**
 * DELETE /api/migrate-images?cleanup=true
 * 
 * Cleanup endpoint to remove base64Data from images that already have blobUrl
 * This frees up space in MongoDB
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cleanup = searchParams.get('cleanup');

  if (cleanup !== 'true') {
    return NextResponse.json({
      success: false,
      error: 'Add ?cleanup=true to confirm cleanup operation'
    }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    
    // Remove base64Data from images that have blobUrl
    const result = await db.collection('imagenes').updateMany(
      {
        blobUrl: { $exists: true, $nin: [null, ''] },
        base64Data: { $exists: true }
      },
      {
        $unset: { base64Data: '' },
        $set: { fechaActualizacion: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} images - removed base64Data field`,
      stats: {
        modified: result.modifiedCount,
        matched: result.matchedCount
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
