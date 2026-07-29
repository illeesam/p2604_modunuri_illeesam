import java.sql.*; import java.io.*;
public class QProp { public static void main(String[] a) throws Exception {
  PrintStream o=new PrintStream(System.out,true,"UTF-8");
  try (Connection c=DriverManager.getConnection("jdbc:postgresql://illeesam.synology.me:17632/postgres?currentSchema=shopjoy_2604","postgres","postgresilleesam");Statement s=c.createStatement()){
    ResultSet r=s.executeQuery("SELECT prop_key, prop_value, site_id FROM shopjoy_2604.sy_prop WHERE prop_key LIKE 'app.file%' ORDER BY prop_key");
    o.println("--- sy_prop app.file.* ---");
    boolean any=false;
    while(r.next()){ any=true; o.println("  "+r.getString(1)+" = "+r.getString(2)+"  [site="+r.getString(3)+"]"); }
    if(!any) o.println("  (없음 → 코드 기본값 사용)");
  }}}
