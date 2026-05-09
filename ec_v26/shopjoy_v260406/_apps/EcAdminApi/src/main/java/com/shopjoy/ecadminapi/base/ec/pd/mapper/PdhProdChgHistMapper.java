package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdChgHistMapper {

    PdhProdChgHistDto.Item selectById(@Param("id") String id);

    List<PdhProdChgHistDto.Item> selectList(PdhProdChgHistDto.Request req);

    List<PdhProdChgHistDto.Item> selectPageList(PdhProdChgHistDto.Request req);

    long selectPageCount(PdhProdChgHistDto.Request req);

    int updateSelective(PdhProdChgHist entity);
}
