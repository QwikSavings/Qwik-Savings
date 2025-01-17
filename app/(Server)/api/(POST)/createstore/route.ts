import { NextResponse } from "next/server";

import { UploadStoreImage } from "@/lib/utilities/CloudinaryConfig";
import db from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// API handler to create store
export async function POST(req: Request) {
  const formData = await req.formData();
  const logo = (formData.get("logo") as File) ?? null;
  const request = (await formData.get("data")) as string;
  const body = await JSON.parse(request);
  // extracting required properties
  const {
    name,
    title,
    ref_link,
    addToHomePage,
    description,
    moreAbout,
    hint,
    faq,
    categories,
    similarStores,
  } = body;

  try {
    let logoUrl;

    // if there is a logo in the form data
    if (logo) {
      // converting the image to a buffer
      const buffer = await logo.arrayBuffer();
      // converting buffer to bytes string for uploading to cloudinary
      const bytes = Buffer.from(buffer);
      // passing buffer to Cloudinary to get image-url for storing in database
      logoUrl = (await UploadStoreImage(
        bytes,
        "store_images",
      )) as unknown as string;
      if (!logoUrl) {
        return NextResponse.json(
          {
            success: false,
            error: "Error uploading image",
          },
          { status: 500 },
        );
      }
    }

    // creating a new store
    const store = await db.store.create({
      data: {
        name,
        title,
        logo_url: logoUrl,
        ref_link,
        addToHomePage: addToHomePage === "yes" ? true : false,
        description: description ? description : null,
        moreAbout: moreAbout ? moreAbout : null,
        hint: hint ? hint : null,
        faq: JSON.stringify(faq),
        categories: {
          connect: categories.map((category: string) => ({
            categoryId: Number(category),
          })),
        },
        similarStores: {
          connect: similarStores.map((store: string) => ({
            storeId: Number(store),
          })),
        },
      },
    });

    // returning response on success
    return NextResponse.json({ success: true, store }, { status: 201 });
  } catch (error) {
    // unique constraint failed
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Store with the name ${name} already exists`,
        },
        { status: 400 },
      );
    }

    // general error response
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
