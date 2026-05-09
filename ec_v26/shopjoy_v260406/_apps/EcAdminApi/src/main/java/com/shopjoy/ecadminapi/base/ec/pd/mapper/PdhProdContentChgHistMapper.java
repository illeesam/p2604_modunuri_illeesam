package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdContentChgHistMapper {

    PdhProdContentChgHistDto.Item selectById(@Param("id") String id);

    List<PdhProdContentChgHistDto.Item> selectList(PdhProdContentChgHistDto.Request req);

    List<PdhProdContentChgHistDto.Item> selectPageList(PdhProdContentChgHistDto.Request req);

    long selectPageCount(PdhProdContentChgHistDto.Request req);

    int updateSelective(PdhProdContentChgHist entity);
}
