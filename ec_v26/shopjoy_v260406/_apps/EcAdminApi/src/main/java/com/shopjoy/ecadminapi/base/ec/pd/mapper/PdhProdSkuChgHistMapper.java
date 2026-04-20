package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdhProdSkuChgHistMapper {

    PdhProdSkuChgHistDto selectById(@Param("id") String id);

    List<PdhProdSkuChgHistDto> selectList(@Param("p") Map<String, Object> p);

    List<PdhProdSkuChgHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdhProdSkuChgHist entity);
}
