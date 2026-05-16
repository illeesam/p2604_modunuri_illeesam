package com.shopjoy.ecadminapi.base.zz.service;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy1Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy2Dto;
import com.shopjoy.ecadminapi.base.zz.data.dto.ZzSamy3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSamy2;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy1Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy2Mapper;
import com.shopjoy.ecadminapi.base.zz.mapper.ZzSamy3Mapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ZzSamy2Service {

    private final ZzSamy1Mapper zzSamy1Mapper;
    private final ZzSamy2Mapper zzSamy2Mapper;
    private final ZzSamy3Mapper zzSamy3Mapper;

    /** getById — 조회 */
    public ZzSamy2Dto.Item getById(String samy2Id) {
        ZzSamy2Dto.Item dto = zzSamy2Mapper.selectById(samy2Id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** getList — 조회 (각 항목에 하위 samy3s 포함) */
    public List<ZzSamy2Dto.Item> getList(ZzSamy2Dto.Request req) {
        List<ZzSamy2Dto.Item> list = zzSamy2Mapper.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getPageData — 조회 (각 항목에 하위 samy3s 포함) */
    public ZzSamy2Dto.PageResponse getPageData(ZzSamy2Dto.Request req) {
        PageHelper.addPaging(req);
        List<ZzSamy2Dto.Item> list = zzSamy2Mapper.selectPageList(req);
        _listFillRelations(list);
        long total = zzSamy2Mapper.selectPageCount(req);
        ZzSamy2Dto.PageResponse res = new ZzSamy2Dto.PageResponse();
        return res.setPageInfo(list, total, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (samy1 단건 / samy3s 목록을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 samy1 1회 + samy3 1회만 조회한다.
     */
    private void _listFillRelations(List<ZzSamy2Dto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> samy1Ids = list.stream()
            .map(ZzSamy2Dto.Item::getSamy1Id)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();
        List<String> samy2Ids = list.stream()
            .map(ZzSamy2Dto.Item::getSamy2Id)
            .filter(StringUtils::hasText)
            .distinct()
            .toList();

        // 상위 samy1 일괄조회 → Map<samy1Id, samy1>
        Map<String, ZzSamy1Dto.Item> samy1Map = Map.of();
        if (!samy1Ids.isEmpty()) {
            ZzSamy1Dto.Request req1 = new ZzSamy1Dto.Request();
            req1.setSamy1Ids(samy1Ids);
            samy1Map = zzSamy1Mapper.selectList(req1).stream()
                .collect(Collectors.toMap(ZzSamy1Dto.Item::getSamy1Id, x -> x, (a, b) -> a));
        }

        // 하위 samy3 일괄조회 → Map<samy2Id, List<samy3>>
        Map<String, List<ZzSamy3Dto.Item>> samy3Map = Map.of();
        if (!samy2Ids.isEmpty()) {
            ZzSamy3Dto.Request req3 = new ZzSamy3Dto.Request();
            req3.setSamy2Ids(samy2Ids);
            samy3Map = zzSamy3Mapper.selectList(req3).stream()
                .collect(Collectors.groupingBy(ZzSamy3Dto.Item::getSamy2Id));
        }

        // 각 항목에 분배
        for (ZzSamy2Dto.Item item : list) {
            item.setSamy1(samy1Map.get(item.getSamy1Id())); // samy1 단건
            item.setSamy3s(samy3Map.getOrDefault(item.getSamy2Id(), List.of())); // samy3 목록
        }
    }

    /** 상위 계층(samy1) / 하위 계층(samy3s) 채우기 */
    private void _itemFillRelations(ZzSamy2Dto.Item item) {
        // 상위 samy1 단건 조회 (samy1Id 기준)
        if (StringUtils.hasText(item.getSamy1Id()))
            item.setSamy1(zzSamy1Mapper.selectById(item.getSamy1Id())); // samy1 단건

        // 하위 samy3 목록 조회 (samy2Id 기준)
        ZzSamy3Dto.Request req3 = new ZzSamy3Dto.Request();
        req3.setSamy2Id(item.getSamy2Id());
        item.setSamy3s(zzSamy3Mapper.selectList(req3)); // samy3 목록
    }

    /** create — 생성 */
    @Transactional
    public ZzSamy2 create(ZzSamy2 body) {
        body.setSamy2Id(CmUtil.generateId("zz_samy2"));
        body.setRgtr(SecurityUtil.getAuthUser().authId());
        body.setRegDt(LocalDate.now());
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy2Mapper.insert(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** update — 수정 */
    @Transactional
    public ZzSamy2 update(String samy2Id, ZzSamy2 body) {
        if (zzSamy2Mapper.selectById(samy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        body.setSamy2Id(samy2Id);
        body.setMdfr(SecurityUtil.getAuthUser().authId());
        body.setMdfcnDt(LocalDate.now());
        if (zzSamy2Mapper.update(body) != 1)
            throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return body;
    }

    /** updateSelective — 부분 수정 */
    @Transactional
    public int updateSelective(ZzSamy2 entity) {
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        return zzSamy2Mapper.updateSelective(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String samy2Id) {
        if (zzSamy2Mapper.selectById(samy2Id) == null)
            throw new CmBizException("존재하지 않는 데이터입니다: " + samy2Id + "::" + CmUtil.svcCallerInfo(this));
        if (zzSamy2Mapper.delete(samy2Id) != 1)
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
