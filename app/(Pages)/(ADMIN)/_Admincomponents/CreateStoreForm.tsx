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
import { useFieldArray } from "react-hook-form";
import { toast } from "@/components/ui/use-toast";
import { CreateStoreFormScehma } from "@/lib/FormSchemas/CreateStoreFormSchema";
import { Textarea } from "@/components/ui/textarea";
import axios from "@/app/api/axios/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, ChangeEvent, useRef } from "react";
import Image from "next/image";
import { MinusCircle } from "lucide-react";
import { AxiosError } from "axios";
import Resizer from "react-image-file-resizer";
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

type InputType = z.infer<typeof CreateStoreFormScehma>;

interface StoreFormProps {
  categories?: { name: string; categoryId: number }[];
  similarStores?: { name: string; storeId: number }[];
}

const CreateStoreForm = ({
  categories = [],
  similarStores = [],
}: StoreFormProps) => {
  const router = useRouter();

  // for creating  categoryOptions
  const categoryOptions = categories.map((category) => {
    return {
      label: category.name,
      id: `${category.categoryId}`,
    };
  });

  //
  const similarStoreOptions = similarStores.map((store) => {
    return {
      label: store.name,
      id: `${store.storeId}`,
    };
  });

  // for image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // reference to the image input field
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

  const form = useForm<InputType>({
    resolver: zodResolver(CreateStoreFormScehma),
    defaultValues: {
      name: "",
      title: "",
      logo: undefined,
      ref_link: "",
      addToHomePage: "no",
      average_discount: "",
      best_offer: "",
      description: "",
      hint: "",
      moreAbout: "",
      faq: [],
      categories: [],
      similarStores: [],
    },
    mode: "all",
    shouldFocusError: true,
  });

  const { control, handleSubmit, formState, setValue } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "faq",
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
  /* 
  NOTE: There is a reason why i have validated the image file here because zod made it not nullable, 
  even in case of an optional field which is a bug in zod.
  hence, i have to validate the file here to avoid the error
  */

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

    // Remove the logo from the data object to not clutter the form data
    const { logo, ...restData } = data;
    formData.append("data", JSON.stringify(restData));

    try {
      const response = await axios.post("/createstore", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const result = response.data;
      if (result.success) {
        toast({
          title: "Success",
          description: "Store created successfully.",
        });
        form.reset();
        setSelectedImage(null); // Reset the selected image
        revalidatePath("/admin");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      if (error instanceof AxiosError) {
        toast({
          title: "Uh Oh!",
          description: error.response?.data.error || "An error occurred.",
          variant: "destructive",
        });
        form.reset();
        setSelectedImage(null);
      }
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
              <FormLabel>Name</FormLabel>
              <sup className="text-app-main">*</sup>
              <FormControl>
                <Input placeholder="Store Name" {...field} type="text" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Store Title" {...field} type="text" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <div className="my-4 flex items-center gap-x-3 ">
            <FormLabel>
              <span className="cursor-pointer rounded-lg border border-muted bg-transparent p-2 px-4 transition-colors duration-300 ease-out hover:bg-accent">
                {selectedImage ? "Change" : "Add"} Logo
              </span>
            </FormLabel>
            <FormControl>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
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
          name="ref_link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Link</FormLabel>
              <sup className="text-app-main">*</sup>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  {...field}
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="addToHomePage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Add to home page?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="moreAbout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>More About</FormLabel>
              <FormControl>
                <Textarea placeholder="More About" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="hint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hint</FormLabel>
              <FormControl>
                <Textarea placeholder="Hint" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Categories</FormLabel>
              <MultiSelector
                options={categoryOptions}
                onValuesChange={field.onChange}
                values={field.value}
                loop={false}
                emptyIndicator="No Categories Found"
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput
                      placeholder={
                        field.value.length <= 0
                          ? "Select Related Catrgories"
                          : ""
                      }
                    />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {categories.map((category) => (
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
        <FormField
          control={control}
          name="similarStores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Stores</FormLabel>
              <MultiSelector
                onValuesChange={field.onChange}
                values={field.value}
                loop={false}
                options={similarStoreOptions}
                emptyIndicator="No Stores Found"
              >
                <FormControl>
                  <MultiSelectorTrigger>
                    <MultiSelectorInput
                      placeholder={
                        field.value.length <= 0 ? "Select Related Stores" : ""
                      }
                    />
                  </MultiSelectorTrigger>
                </FormControl>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {similarStores.map((store) => (
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

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4">
            <div className="flex items-center gap-x-2">
              <FormField
                control={control}
                name={`faq.${index}.question`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Question ${index + 1}`}
                        {...field}
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <MinusCircle
                className="size-6 translate-y-1/2 cursor-pointer text-destructive"
                onClick={() => remove(index)}
              />
            </div>
            <FormField
              control={control}
              name={`faq.${index}.answer`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Answer for Q.${index + 1}`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          onClick={() => append({ question: "", answer: "" })}
          variant={"outline"}
          size={"lg"}
          className="place-self-center rounded-lg hover:shadow-md"
        >
          Add FAQ
        </Button>

        <p className="mt-2 place-self-center text-xs text-gray-400">
          Fields marked with<span className="text-app-main"> * </span>are
          required
        </p>

        <Button
          type="submit"
          className="w-full place-self-center rounded-lg hover:shadow-md"
          disabled={formState.isSubmitting}
        >
          {formState.isSubmitting ? "Creating..." : "Create Store"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateStoreForm;
