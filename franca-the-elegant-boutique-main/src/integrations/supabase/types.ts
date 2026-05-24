export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      carrito_items: {
        Row: {
          cantidad: number
          color: string | null
          created_at: string
          id: string
          nombre_snapshot: string
          pedido_id: string
          precio_unitario: number
          producto_id: string
          talle: string
        }
        Insert: {
          cantidad: number
          color?: string | null
          created_at?: string
          id?: string
          nombre_snapshot: string
          pedido_id: string
          precio_unitario: number
          producto_id: string
          talle: string
        }
        Update: {
          cantidad?: number
          color?: string | null
          created_at?: string
          id?: string
          nombre_snapshot?: string
          pedido_id?: string
          precio_unitario?: number
          producto_id?: string
          talle?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrito_items_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carrito_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          orden: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          orden?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          orden?: number
          updated_at?: string
        }
        Relationships: []
      }
      codigos_descuento: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          expira_at: string | null
          id: string
          tipo: Database["public"]["Enums"]["tipo_descuento"]
          updated_at: string
          valor: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          expira_at?: string | null
          id?: string
          tipo: Database["public"]["Enums"]["tipo_descuento"]
          updated_at?: string
          valor: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          expira_at?: string | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_descuento"]
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      datos_bancarios: {
        Row: {
          alias: string
          banco: string
          cbu: string
          created_at: string
          email_contacto: string
          id: string
          notas: string
          titular: string
          updated_at: string
        }
        Insert: {
          alias?: string
          banco?: string
          cbu?: string
          created_at?: string
          email_contacto?: string
          id?: string
          notas?: string
          titular?: string
          updated_at?: string
        }
        Update: {
          alias?: string
          banco?: string
          cbu?: string
          created_at?: string
          email_contacto?: string
          id?: string
          notas?: string
          titular?: string
          updated_at?: string
        }
        Relationships: []
      }
      favoritos: {
        Row: {
          created_at: string
          id: string
          producto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          producto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          producto_id?: string
          user_id?: string
        }
        Relationships: []
      }
      locales_retiro: {
        Row: {
          activo: boolean
          ciudad: string
          created_at: string
          direccion: string
          horarios: string
          id: string
          nombre: string
          notas: string
          orden: number
          provincia: string
          telefono: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ciudad?: string
          created_at?: string
          direccion?: string
          horarios?: string
          id?: string
          nombre: string
          notas?: string
          orden?: number
          provincia?: string
          telefono?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ciudad?: string
          created_at?: string
          direccion?: string
          horarios?: string
          id?: string
          nombre?: string
          notas?: string
          orden?: number
          provincia?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      mensajes_contacto: {
        Row: {
          asunto: string
          created_at: string
          email: string
          id: string
          leido: boolean
          mensaje: string
          nombre: string
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          asunto: string
          created_at?: string
          email: string
          id?: string
          leido?: boolean
          mensaje: string
          nombre: string
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          asunto?: string
          created_at?: string
          email?: string
          id?: string
          leido?: boolean
          mensaje?: string
          nombre?: string
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          cliente_email: string | null
          cliente_nombre: string
          cliente_telefono: string | null
          codigo_descuento: string | null
          comprobante_url: string | null
          created_at: string
          descuento_aplicado: number
          direccion_envio: string | null
          estado: Database["public"]["Enums"]["estado_pedido"]
          id: string
          metodo_pago: string
          notas: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cliente_email?: string | null
          cliente_nombre: string
          cliente_telefono?: string | null
          codigo_descuento?: string | null
          comprobante_url?: string | null
          created_at?: string
          descuento_aplicado?: number
          direccion_envio?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          metodo_pago?: string
          notas?: string | null
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cliente_email?: string | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          codigo_descuento?: string | null
          comprobante_url?: string | null
          created_at?: string
          descuento_aplicado?: number
          direccion_envio?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          metodo_pago?: string
          notas?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          nombre: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      producto_consultas: {
        Row: {
          created_at: string
          id: string
          nombre_usuario: string
          pregunta: string
          producto_id: string
          respondida_at: string | null
          respuesta: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre_usuario?: string
          pregunta: string
          producto_id: string
          respondida_at?: string | null
          respuesta?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre_usuario?: string
          pregunta?: string
          producto_id?: string
          respondida_at?: string | null
          respuesta?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_consultas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_imagenes: {
        Row: {
          alt: string
          created_at: string
          id: string
          orden: number
          producto_id: string
          url: string
        }
        Insert: {
          alt?: string
          created_at?: string
          id?: string
          orden?: number
          producto_id: string
          url: string
        }
        Update: {
          alt?: string
          created_at?: string
          id?: string
          orden?: number
          producto_id?: string
          url?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          activo: boolean
          categoria: string
          color: string[]
          costo: number | null
          created_at: string
          descripcion: string
          destacado: boolean
          id: string
          imagen_url: string
          nombre: string
          precio: number
          slug: string
          stock: number
          talles: string[]
          talles_medidas: Json
          updated_at: string
        }
        Insert: {
          activo?: boolean
          categoria: string
          color?: string[]
          costo?: number | null
          created_at?: string
          descripcion?: string
          destacado?: boolean
          id?: string
          imagen_url?: string
          nombre: string
          precio: number
          slug: string
          stock?: number
          talles?: string[]
          talles_medidas?: Json
          updated_at?: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          color?: string[]
          costo?: number | null
          created_at?: string
          descripcion?: string
          destacado?: boolean
          id?: string
          imagen_url?: string
          nombre?: string
          precio?: number
          slug?: string
          stock?: number
          talles?: string[]
          talles_medidas?: Json
          updated_at?: string
        }
        Relationships: []
      }
      site_imagenes: {
        Row: {
          alt: string
          key: string
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string
          key: string
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string
          key?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      crear_mensaje_contacto: {
        Args: {
          p_asunto: string
          p_email: string
          p_mensaje: string
          p_nombre: string
          p_telefono?: string
        }
        Returns: string
      }
      crear_pedido_seguro: {
        Args: {
          p_cliente_email?: string
          p_cliente_nombre: string
          p_cliente_telefono?: string
          p_codigo_descuento?: string
          p_direccion_envio?: string
          p_items: Json
          p_metodo_pago?: string
          p_notas?: string
        }
        Returns: string
      }
      get_consultas_publicas: {
        Args: { p_producto_id: string }
        Returns: {
          created_at: string
          id: string
          nombre_usuario: string
          pregunta: string
          producto_id: string
          respondida_at: string
          respuesta: string
        }[]
      }
      get_datos_bancarios_publico: {
        Args: never
        Returns: {
          alias: string
          banco: string
          cbu: string
          id: string
          notas: string
          titular: string
        }[]
      }
      promote_user_to_admin: { Args: { _email: string }; Returns: boolean }
      set_comprobante_pedido: {
        Args: { p_path: string; p_pedido_id: string }
        Returns: undefined
      }
      validar_codigo_descuento: {
        Args: { p_codigo: string }
        Returns: {
          codigo: string
          tipo: Database["public"]["Enums"]["tipo_descuento"]
          valor: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      categoria_producto:
        | "Sweaters"
        | "Pantalones"
        | "Camisas"
        | "Abrigos"
        | "Faldas"
        | "Accesorios"
      estado_pedido:
        | "pendiente"
        | "confirmado"
        | "enviado"
        | "entregado"
        | "cancelado"
        | "esperando_transferencia"
        | "comprobante_recibido"
        | "pagado"
      tipo_descuento: "porcentaje" | "monto_fijo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      categoria_producto: [
        "Sweaters",
        "Pantalones",
        "Camisas",
        "Abrigos",
        "Faldas",
        "Accesorios",
      ],
      estado_pedido: [
        "pendiente",
        "confirmado",
        "enviado",
        "entregado",
        "cancelado",
        "esperando_transferencia",
        "comprobante_recibido",
        "pagado",
      ],
      tipo_descuento: ["porcentaje", "monto_fijo"],
    },
  },
} as const
