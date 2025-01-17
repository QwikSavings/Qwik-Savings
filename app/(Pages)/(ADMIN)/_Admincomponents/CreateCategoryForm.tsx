"use client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import axios from "@/app/api/axios/axios";
import { AxiosError } from "axios";
import Resizer from "react-image-file-resizer";
import { CreateCategoryFormSchema } from "@/lib/FormSchemas/CreateCategoryFormSchema";
import Image from "next/image";
import { MinusCircle } from "lucide-react";
import { ChangeEvent, useRef, useState } from "react";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/MultipleSelector";
import { revalidatePath } from "next/cache";
import { useRouter } from "next/navigation";

type InputType = z.infer<typeof CreateCategoryFormSchema>;

interface CategoryFormProps {
  similarCategories: { name: string; categoryId: number }[];
  stores: { name: string; storeId: number }[];
}

const CreateCategoryForm = ({
  similarCategories,
  stores,
}: CategoryFormProps) => {
  const router = useRouter();

  // creating similarCategoryOptions for multiselector
  const similarCategoryOptions = similarCategories.map((category) => ({
    label: category.name,
    id: `${category.categoryId}`,
  }));

  // creating storeOptions for multiselector
  const storeOptions = stores.map((store) => ({
    label: store.name,
    id: `${store.storeId}`,
  }));

  // decalring the form object
  const form = useForm<InputType>({
    resolver: zodResolver(CreateCategoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      logo: undefined,
      stores: [],
      similarCategories: [],
    },
    mode: "all",
    shouldFocusError: true,
  });

  const { control, handleSubmit, formState, setValue } = form;

  // for image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Image ref
  const imageRef = useRef<HTMLInputElement>(null);
  // function to resize images for proper resolution
  const resizeFile = (file: File) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        400,
        400,
        "JPEG",
        100,
        0,
        (uri) => {
          resolve(uri);
        },
        "blob",
        400,
        400,
      );
    });

  // handle logo image onChange event
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const resizedFile = await resizeFile(file);
      setValue("logo", resizedFile);
      setSelectedImage(URL.createObjectURL(file));
    }
  };

  // function to remove the selected image
  const removeImage = () => {
    setSelectedImage(null);
    setValue("logo", undefined);
    if (imageRef.current) {
      imageRef.current.src = "";
      imageRef.current.value = "";
    }
  };

  // form submission handler
  const onSubmit: SubmitHandler<InputType> = async (data) => {
    const formData = new FormData();
    if (data.logo) {
      formData.append("logo", data.logo);
    }
    const { logo, ...restData } = data;
    formData.append("data", JSON.stringify(restData));
    try {
      const result = await axios.post("/createcategory", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (result.data.success) {
        toast({
          title: "Success",
          description: "Caategory Created Successfully",
        });
        form.reset();
        setSelectedImage(null);
        revalidatePath("/admin");
        router.refresh();
      }
    } catch (err) {
      console.log(err);
      if (err instanceof AxiosError) {
        toast({
          title: "Uh Oh!",
          description: err.response?.data.error,
          variant: "destructive",
        });
      }
      setSelectedImage(null);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col space-y-4"
      >
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <sup className="text-app-main">*</sup>
              <FormControl>
                <Input
                  placeholder="Enter a Category Name"
                  {...field}
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <div className="my-4 flex items-center gap-x-3">
            <FormLabel>
              <span className="cursor-pointer rounded-lg border border-muted bg-transparent p-2 px-4 transition-colors duration-300 ease-out hover:bg-accent">
                {selectedImage ? "Change" : "Add"} Logo
              </span>
            </FormLabel>
            <FormControl>
              <input
                type="file"
                accept="image/*"
                ref={imageRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </FormControl>
            {selectedImage && (
              <>
                <Image
                  src={selectedImage}
                  alt="Upload Image"
                  width={80}
                  height={80}
                  className="aspect-square"
                />
                <MinusCircle
                  className="size-6 translate-y-1/2 cursor-pointer text-destructive"
                  onClick={removeImage}
                />
              </>
            )}
          </div>
          <FormMessage />
        </FormItem>
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter Description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="stores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Stores</FormLabel>
              <MultiSelector
                onValuesChange={field.onChange}
                values={field.value}
                loop={false}
                options={storeOptions}
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput
                      placeholder="Select Related Stores"
                      className={`${field.value.length > 0 ? "placeholder:hidden" : ""}`}
                    />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {stores.map((store) => (
                      <MultiSelectorItem
                        key={store.storeId}
                        value={`${store.storeId}`}
                        id={store.storeId.toString()}
                        label={store.name}
                      >
                        {store.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
                <FormMessage />
              </MultiSelector>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="similarCategories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related categories</FormLabel>
              <MultiSelector
                onValuesChange={field.onChange}
                values={field.value}
                loop={false}
                options={similarCategoryOptions}
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput
                      placeholder="Select Related Categories"
                      className={`${field.value.length > 0 ? "placeholder:hidden" : ""}`}
                    />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {similarCategories.map((category) => (
                      <MultiSelectorItem
                        key={category.categoryId}
                        value={`${category.categoryId}`}
                        id={category.categoryId.toString()}
                        label={category.name}
                      >
                        {category.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
                <FormMessage />
              </MultiSelector>
            </FormItem>
          )}
        />

        <p className="mt-2 place-self-center text-xs text-gray-400">
          Fields marked with<span className="text-app-main"> * </span>are
          required
        </p>

        <Button
          type="submit"
          className="w-full place-self-center rounded-lg hover:shadow-md"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Creating..." : "Create Category"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateCategoryForm;
