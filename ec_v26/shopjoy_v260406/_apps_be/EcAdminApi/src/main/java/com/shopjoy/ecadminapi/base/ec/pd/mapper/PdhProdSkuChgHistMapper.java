package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface PdhProdSkuChgHistMapper {

    PdhProdSkuChgHistDto.Item selectById(@Param("id") String id);

    List<PdhProdSkuChgHistDto.Item> selectList(Map<String, Object> p);

    List<PdhProdSkuChgHistDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(PdhProdSkuChgHist entity);
}
