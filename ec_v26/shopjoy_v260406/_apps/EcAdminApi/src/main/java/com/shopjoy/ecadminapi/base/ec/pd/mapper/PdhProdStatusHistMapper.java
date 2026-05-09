package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdhProdStatusHistMapper {

    PdhProdStatusHistDto.Item selectById(@Param("id") String id);

    List<PdhProdStatusHistDto.Item> selectList(PdhProdStatusHistDto.Request req);

    List<PdhProdStatusHistDto.Item> selectPageList(PdhProdStatusHistDto.Request req);

    long selectPageCount(PdhProdStatusHistDto.Request req);

    int updateSelective(PdhProdStatusHist entity);
}
