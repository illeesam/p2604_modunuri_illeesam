package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGroupRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbMemberGroupService {

    private final MbMemberGroupRepository mbMemberGroupRepository;

    @PersistenceContext
    private EntityManager em;

    /* 회원 그룹 키조회 */
    public MbMemberGroupDto.Item getById(String id) {
        MbMemberGroupDto.Item dto = mbMemberGroupRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberGroupDto.Item getByIdOrNull(String id) {
        return mbMemberGroupRepository.selectById(id).orElse(null);
    }

    /* 회원 그룹 상세조회 */
    public MbMemberGroup findById(String id) {
        return mbMemberGroupRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbMemberGroup findByIdOrNull(String id) {
        return mbMemberGroupRepository.findById(id).orElse(null);
    }

    /* 회원 그룹 키검증 */
    public boolean existsById(String id) {
        return mbMemberGroupRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbMemberGroupRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 회원 그룹 목록조회 */
    public List<MbMemberGroupDto.Item> getList(MbMemberGroupDto.Request req) {
        return mbMemberGroupRepository.selectList(req);
    }

    /* 회원 그룹 페이지조회 */
    public MbMemberGroupDto.PageResponse getPageData(MbMemberGroupDto.Request req) {
        PageHelper.addPaging(req);
        return mbMemberGroupRepository.selectPageList(req);
    }

    /* 회원 그룹 등록 */
    @Transactional
    public MbMemberGroup create(MbMemberGroup body) {
        body.setMemberGroupId(CmUtil.generateId("mb_member_group"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbMemberGroup saved = mbMemberGroupRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 회원 그룹 수정 */
    @Transactional
    public MbMemberGroup update(String id, MbMemberGroup body) {
        CmUtil.requireId(id, "id", this);
        MbMemberGroup entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "memberGroupId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbMemberGroup saved = mbMemberGroupRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 회원 그룹 수정 */
    @Transactional
    public MbMemberGroup updateSelective(MbMemberGroup entity) {
        if (entity.getMemberGroupId() == null) throw new CmBizException("memberGroupId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getMemberGroupId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getMemberGroupId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbMemberGroupRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 회원 그룹 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbMemberGroup entity = findById(id);
        mbMemberGroupRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbMemberGroup save(String cmd, MbMemberGroup entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getMemberGroupId() == null || entity.getMemberGroupId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getMemberGroupId() == null)
                    throw new CmBizException("삭제 대상 memberGroupId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!mbMemberGroupRepository.existsById(entity.getMemberGroupId()))
                    throw new CmBizException("존재하지 않는 MbMemberGroup입니다: " + entity.getMemberGroupId() + "::" + CmUtil.svcCallerInfo(this));
                mbMemberGroupRepository.deleteById(entity.getMemberGroupId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setMemberGroupId(CmUtil.generateId("mb_member_group"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                MbMemberGroup saved = mbMemberGroupRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getMemberGroupId() == null)
                    throw new CmBizException("수정 대상 memberGroupId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = mbMemberGroupRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 MbMemberGroup입니다: " + entity.getMemberGroupId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getMemberGroupId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<MbMemberGroup> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (MbMemberGroup row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getMemberGroupId() == null || row.getMemberGroupId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, MbMemberGroup::getMemberGroupId, "U", "memberGroupId", this);
            CmUtil.requireRowIds(rows, MbMemberGroup::getMemberGroupId, "D", "memberGroupId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(MbMemberGroup::getMemberGroupId)
                .toList();
            if (!deleteIds.isEmpty()) {
                mbMemberGroupRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<MbMemberGroup> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (MbMemberGroup row : updateRows) {
                row.setUpdBy(authId);
                int affected = mbMemberGroupRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getMemberGroupId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<MbMemberGroup> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (MbMemberGroup row : insertRows) {
                row.setMemberGroupId(CmUtil.generateId("mb_member_group"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                mbMemberGroupRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
