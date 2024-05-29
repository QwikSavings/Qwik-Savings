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
import { useState, ChangeEvent } from "react";
import Image from "next/image";
import { MinusCircle } from "lucide-react";
import { AxiosError } from "axios";

type InputType = z.infer<typeof CreateStoreFormScehma>;

const CreateStoreForm = () => {
  // for image preview
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const form = useForm<InputType>({
    resolver: zodResolver(CreateStoreFormScehma),
    defaultValues: {
      name: "",
      title: "",
      logo: undefined,
      ref_link: "",
      type: "Deal",
      average_discount: "",
      best_offer: "",
      description: "",
      hint: "",
      moreAbout: "",
      faq: [],
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
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue("logo", file);
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
      // Handle the form submission, e.g., send data to the server
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
          <div className="mt-3 flex items-center gap-x-3">
            <FormLabel>
              <span className="cursor-pointer rounded-lg border border-muted bg-transparent p-2 px-4 transition-colors duration-300 ease-out hover:bg-accent">
                {selectedImage ? "Change" : "Add"} Logo
              </span>
            </FormLabel>
            <FormControl>
              <input
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
                  className="size-6 cursor-pointer text-destructive"
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Deal">Deal</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
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
                className="size-6 cursor-pointer text-destructive"
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